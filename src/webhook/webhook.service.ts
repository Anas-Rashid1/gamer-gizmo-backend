// src/webhook/webhook.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class WebhookService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });

  constructor(
    private prisma: PrismaService,
    private orderService: OrderService, // use this to create order
  ) {}

  async handleStripeEvent(req: any, signature: string) {
    const sig = signature;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret,
      );
      console.log('Anas');
    } catch (err) {
      console.error('Stripe webhook error:', err.message);
      throw new BadRequestException(`Stripe error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;

      const user_id = intent.metadata.user_id;
      const shipping_address = JSON.parse(intent.metadata.shipping_address);
      const shipping_rate = parseFloat(intent.metadata.shipping_rate);
      const items = JSON.parse(intent.metadata.items);

      // Call order creation method from OrderService
      await this.orderService.createOrderFromWebhook({
        user_id: Number(user_id),
        items,
        shipping_address,
        shipping_rate,
        payment_method: 'online',
        payment_intent: intent.id,
      });
    }

    // handle more events if needed
  }
}
