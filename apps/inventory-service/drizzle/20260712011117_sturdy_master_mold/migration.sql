ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_company_id_company_references_id_fk";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_company_id_company_references_id_fk";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_default_currency_id_currency_references_id_fk";--> statement-breakpoint
ALTER TABLE "stock_balances" DROP CONSTRAINT "stock_balances_company_id_company_references_id_fk";--> statement-breakpoint
ALTER TABLE "stock_documents" DROP CONSTRAINT "stock_documents_company_id_company_references_id_fk";--> statement-breakpoint
ALTER TABLE "stock_documents" DROP CONSTRAINT "stock_documents_partner_id_business_partner_references_id_fk";--> statement-breakpoint
ALTER TABLE "stock_documents" DROP CONSTRAINT "stock_documents_currency_id_currency_references_id_fk";--> statement-breakpoint
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_company_id_company_references_id_fk";--> statement-breakpoint
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_currency_id_currency_references_id_fk";--> statement-breakpoint
ALTER TABLE "unit_groups" DROP CONSTRAINT "unit_groups_company_id_company_references_id_fk";--> statement-breakpoint
ALTER TABLE "units_of_measure" DROP CONSTRAINT "units_of_measure_company_id_company_references_id_fk";--> statement-breakpoint
ALTER TABLE "warehouses" DROP CONSTRAINT "warehouses_company_id_company_references_id_fk";