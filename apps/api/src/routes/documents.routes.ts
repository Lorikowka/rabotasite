import type { FastifyInstance } from 'fastify';
import { formatPayment } from '@teenwork/shared';
import { forbidden, notFound } from '../lib/errors.js';
import { getApplicationForParticipant } from '../services/application.service.js';
import {
  generateEmploymentContractPdf,
  generateParentConsentPdf,
} from '../services/pdf.service.js';
import { getEmployerProfile, getTeenProfile, getUserById } from '../services/user.service.js';

export async function documentRoutes(app: FastifyInstance): Promise<void> {
  /** PDF: согласие родителя (законного представителя). */
  app.get(
    '/api/documents/parent-consent',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { applicationId } = request.query as { applicationId?: string };
      if (!applicationId) throw notFound('Не указан отклик');

      const { sub } = request.user as { sub: string };
      const { application, listing } = await getApplicationForParticipant(applicationId, sub);

      if (application.teenId !== sub) {
        throw forbidden('Согласие формируется соискателем', 'teen_only');
      }

      const teen = await getUserById(application.teenId);
      const employer = await getUserById(listing.employerId);
      const employerProfile = await getEmployerProfile(listing.employerId);
      const teenProfile = await getTeenProfile(application.teenId);

      if (!teen || !employer) throw notFound('Данные не найдены');

      const birthDate = teen.birthDate ?? '';
      const age = birthDate
        ? new Date().getFullYear() -
          new Date(birthDate).getFullYear() -
          (new Date().getMonth() < new Date(birthDate).getMonth() ||
          (new Date().getMonth() === new Date(birthDate).getMonth() &&
            new Date().getDate() < new Date(birthDate).getDate())
            ? 1
            : 0)
        : 0;

      const schedule = listing.shiftStart && listing.shiftEnd
        ? `с ${listing.shiftStart} до ${listing.shiftEnd}, не более ${listing.maxHoursPerDay} ч в день`
        : `не более ${listing.maxHoursPerDay} ч в день`;

      const pdf = await generateParentConsentPdf({
        childFullName: teen.fullName,
        childBirthDate: birthDate,
        childAge: age,
        employerName: employerProfile?.companyName ?? employer.fullName,
        employerInn: employerProfile?.inn ?? null,
        employerIsBusiness: employer.role === 'business',
        jobTitle: listing.title,
        workAddress: listing.locationAddress ?? 'указано в объявлении',
        workSchedule: schedule,
        paymentTerms: formatPayment(listing.paymentAmount, listing.paymentType),
        workStartDate: new Date().toLocaleDateString('ru-RU'),
        applicationId: application.id,
      });

      reply.header('Content-Type', 'application/pdf');
      reply.header(
        'Content-Disposition',
        `attachment; filename="soglasie-roditelya-${application.id.slice(0, 8)}.pdf"`,
      );
      return reply.send(Buffer.from(pdf));
    },
  );

  /** PDF: срочный трудовой договор (для работодателя). */
  app.get(
    '/api/documents/employment-contract',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { applicationId } = request.query as { applicationId?: string };
      if (!applicationId) throw notFound('Не указан отклик');

      const { sub } = request.user as { sub: string };
      const { application, listing } = await getApplicationForParticipant(applicationId, sub);

      const teen = await getUserById(application.teenId);
      const employer = await getUserById(listing.employerId);
      const employerProfile = await getEmployerProfile(listing.employerId);
      if (!teen || !employer) throw notFound('Данные не найдены');

      const pdf = await generateEmploymentContractPdf({
        employeeFullName: teen.fullName,
        employeeBirthDate: teen.birthDate ?? '',
        employerName: employerProfile?.companyName ?? employer.fullName,
        employerInn: employerProfile?.inn ?? null,
        employerIsBusiness: employer.role === 'business',
        jobTitle: listing.title,
        workAddress: listing.locationAddress ?? 'указано в объявлении',
        workSchedule:
          listing.shiftStart && listing.shiftEnd
            ? `с ${listing.shiftStart} до ${listing.shiftEnd}`
            : 'по договорённости',
        payment: formatPayment(listing.paymentAmount, listing.paymentType),
        contractTerm: listing.type === 'vacancy' ? 'на сезон / до 3 месяцев' : 'на период выполнения задания',
        applicationId: application.id,
      });

      reply.header('Content-Type', 'application/pdf');
      reply.header(
        'Content-Disposition',
        `attachment; filename="trudovoi-dogovor-${application.id.slice(0, 8)}.pdf"`,
      );
      return reply.send(Buffer.from(pdf));
    },
  );

  /** Памятка «Как не попасться мошенникам». */
  app.get('/api/documents/safety-memo', async () => {
    return {
      title: '5 красных флагов: как не попасться мошенникам',
      intro:
        'Подростку 14–18 лет особенно важно помнить: легальный работодатель не торопит, не требует денег и не зовёт перейти в другой мессенджер.',
      flags: [
        {
          title: 'Просят залог, взнос или оплату обучения',
          text: 'Легальная работа не требует от вас денег. Залог и «взнос за обучение» — самые частые признаки мошенничества.',
        },
        {
          title: 'Зовут в Telegram, WhatsApp или «пишите в директ»',
          text: 'Общайтесь только внутри платформы: там есть защита, история переписки и кнопка жалобы.',
          },
        {
          title: 'Не хотят оформлять договор и согласие родителей',
          text: 'Согласие родителей и трудовой договор — обязательные документы. Без них работу можно считать нелегальной.',
        },
        {
          title: 'Ночная смена или больше 4–5 часов подряд',
          text: 'Подростку до 18 лет нельзя работать ночью и дольше 4–5 часов в день. Это ограничение ТК РФ.',
        },
        {
          title: 'Просят перевести деньги, карту или паспорт',
          text: 'Никогда не переводите деньги «за оборудование», не отправляйте фото документов и реквизиты карты.',
        },
      ],
      selfEmployed: {
        title: 'Самозанятость с 14 лет',
        text: 'Оформить статус НПД можно в приложении «Мой налог» с паспортом и согласием родителя. Это законный способ работать с разовыми заказами и платить налог.',
      },
    };
  });
}
