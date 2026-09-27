import { requireAdminPage } from '@/app/admin/guard';
import PromoCodesClient from './page-client';
export default async function AdminPromoCodesPage(){await requireAdminPage();return <PromoCodesClient/>;}
