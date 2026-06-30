import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";

/**
 * Razorpay Webhook Handler
 *
 * Razorpay sends event confirmations to this endpoint after payment state changes.
 * This is the source-of-truth fallback for payment confirmation independent
 * of the frontend success callback.
 *
 * Setup in Razorpay Dashboard:
 * Settings → Webhooks → Add URL: https://yourdomain.com/api/webhooks/razorpay
 * Events: payment.captured, payment.failed, order.paid
 *
 * Set RAZORPAY_WEBHOOK_SECRET in your .env file.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // ── 1. Verify webhook signature ───────────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not set.");
      // Return 200 anyway to prevent Razorpay from retrying endlessly
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!signature) {
      console.warn("[Razorpay Webhook] Missing x-razorpay-signature header.");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("[Razorpay Webhook] Invalid webhook signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ── 2. Parse and handle event ─────────────────────────────────────────────
    const event = JSON.parse(body);
    const eventType: string = event.event;

    console.log(`[Razorpay Webhook] Received: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId: string | undefined = payment?.order_id;
      const razorpayPaymentId: string | undefined = payment?.id;

      if (!razorpayOrderId || !razorpayPaymentId) {
        console.warn("[Razorpay Webhook] Missing order_id or payment id in payload.");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Find the order in our database
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId },
        include: { payment: true, profile: { include: { user: true } } },
      });

      if (!order) {
        console.warn(`[Razorpay Webhook] Order not found for razorpayOrderId: ${razorpayOrderId}`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Idempotency: skip if already processed
      if (order.status === "COMPLETED" && order.payment) {
        console.log(`[Razorpay Webhook] Order ${razorpayOrderId} already completed. Skipping.`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Duplicate transaction guard
      const existingPayment = await prisma.payment.findUnique({
        where: { transactionId: razorpayPaymentId },
      });

      if (!existingPayment) {
        // Mark order completed and create payment record
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        });

        await prisma.payment.create({
          data: {
            orderId: order.id,
            paymentMethod: "RAZORPAY_WEBHOOK",
            transactionId: razorpayPaymentId,
          },
        });

        // Update user plan if order has planId
        if ((order as any).planId && order.profile?.user?.email) {
          await prisma.user.update({
            where: { email: order.profile.user.email },
            data: { plan: (order as any).planId.toUpperCase() as any },
          });
        }

        console.log(`[Razorpay Webhook] ✅ Order ${razorpayOrderId} marked COMPLETED via webhook.`);
      }
    } else if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId: string | undefined = payment?.order_id;

      if (razorpayOrderId) {
        await prisma.order.updateMany({
          where: { razorpayOrderId, status: "PENDING" },
          data: { status: "FAILED" },
        });
        console.log(`[Razorpay Webhook] Order ${razorpayOrderId} marked FAILED.`);
      }
    } else {
      // Acknowledge unhandled events without error
      console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Razorpay Webhook] Unhandled error:", error);
    // Return 200 to prevent Razorpay retrying on server errors
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
