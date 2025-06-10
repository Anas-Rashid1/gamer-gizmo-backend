// src/webhook/webhook.controller.ts
import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';
import Stripe from 'stripe';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  // ✅ POST /webhook/stripe
  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      await this.webhookService.handleStripeEvent(req, signature);
      console.log('muhammad');
      res.send({ received: true });
    } catch (error) {
      console.error('Webhook Error:', error.message);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
