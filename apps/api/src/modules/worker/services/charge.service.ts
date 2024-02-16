import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionStyle } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { PRICE_PER_MESSAGE } from 'src/utils/contants';
import { formatSize } from 'src/utils/format';
import { storageToMoney } from 'src/utils/format-money';
import moment from 'moment';

@Injectable()
export class ChargeService {
	constructor(private readonly prisma: PrismaService) { }

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async execute() {
		console.log(`[CHARGE] started at: ${new Date()}`);
		await Promise.all([this.chargeMessage(), this.chargeStorage()]);
		console.log(`[CHARGE] ended at: ${new Date()}`);
	}

	async chargeMessage() {
		const messages = await this.prisma.message.groupBy({
			where: {
				hasCharged: false,
				sentAt: {
					isSet: true,
				},
				deletedAt: {
					isSet: false,
				},
			},
			by: ['userId'],
			_count: {
				id: true,
			},
		});

		for (const {
			userId,
			_count: { id: messagesAmount },
		} of messages) {
			try {
				const price = messagesAmount * PRICE_PER_MESSAGE;

				await this.removeBalance({
					amount: price,
					style: 'message_charge',
					userId,
					description: `Charge for ${messagesAmount} sent messages`,
				});

				await this.prisma.message.updateMany({
					where: {
						userId,
						hasCharged: false,
						sentAt: {
							isSet: true,
						},
						deletedAt: {
							isSet: false,
						},
					},
					data: {
						hasCharged: true,
					},
				});

				console.log(`[CHARGE_MESSAGE] ${userId} - ${price}`);
			} catch (error) {
				console.log(`[CHARGE_MESSAGE] ${JSON.stringify(error)}`);
			}
		}

		console.log(`[CHARGE_MESSAGE] ended at: ${new Date()}`);
	}

	async chargeStorage() {
		const today = moment().set({
			hour: 0,
			minute: 0,
			second: 0,
			milliseconds: 0,
		});

		const storageSize = await this.prisma.storageSize.groupBy({
			where: {
				deletedAt: {
					isSet: false,
				},
				chargedAt: {
					isSet: false,
				},
				chargeAt: {
					gte: today.toDate(),
				},
			},
			by: ['userId'],
			_sum: {
				size: true,
			},
		});

		for (const {
			userId,
			_sum: { size },
		} of storageSize) {
			const firstDayOfMonth = moment().startOf('month').set({
				hour: 0,
				minute: 0,
				second: 0,
				milliseconds: 0,
			});
			const days = moment().diff(firstDayOfMonth, 'days') + 1;
			const averageSize = Math.round(size / days);
			const price = storageToMoney(averageSize);

			await this.removeBalance({
				amount: price,
				style: 'storage_charge',
				userId,
				description: `Charge for an average of ${formatSize(averageSize)} stored`,
			});

			await this.prisma.storageSize.updateMany({
				where: {
					userId,
					deletedAt: {
						isSet: false,
					},
					chargedAt: {
						isSet: false,
					},
					chargeAt: {
						gte: today.toDate(),
					},
				},
				data: {
					chargedAt: new Date(),
				},
			});

			console.log(`[CHARGE_STORAGE] ${userId} - ${price}`);
		}

		console.log(`[CHARGE_STORAGE] ended at: ${new Date()}`);
	}

	async removeBalance({
		amount,
		userId,
		style,
		description,
	}: {
		amount: number;
		userId: string;
		style: TransactionStyle;
		description: string;
	}) {
		const negativeAmount = Math.round(amount) * -1;

		if (negativeAmount === 0) {
			return;
		}

		await this.prisma.transaction.create({
			data: {
				amount: negativeAmount,
				style,
				userId,
				description,
			},
		});
	}
}