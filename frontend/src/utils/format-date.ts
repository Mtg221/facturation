import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export function formatDate(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY');
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

export function formatRelative(date: string | Date): string {
  return dayjs(date).fromNow();
}
