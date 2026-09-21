create or replace function public.get_transfer_dashboard(p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with filtered as (
  select *
  from public.stock_transfers
  where p_days = 0 or completed_at >= now() - make_interval(days => p_days)
), expanded as (
  select transfer.client_id, item->>'sku' as sku, (item->>'quantity')::integer as quantity
  from filtered as transfer
  cross join lateral jsonb_array_elements(transfer.items) as item
), top_skus as (
  select sku, sum(quantity)::integer as units
  from expanded
  group by sku
  order by units desc, sku
  limit 5
), routes as (
  select source_bin as source, destination_bin as destination, count(*)::integer as transfers
  from filtered
  group by source_bin, destination_bin
  order by transfers desc, source_bin, destination_bin
  limit 5
), recent as (
  select reference, source_bin as source, destination_bin as destination, items, completed_at
  from filtered
  order by completed_at desc
  limit 10
), low_stock as (
  select bin_id as bin, sku, quantity
  from public.inventory
  where quantity <= 10
  order by quantity, bin_id, sku
  limit 20
)
select jsonb_build_object(
  'totalTransfers', (select count(*) from filtered),
  'unitsMoved', coalesce((select sum(quantity) from expanded), 0),
  'topSkus', coalesce((select jsonb_agg(jsonb_build_object('sku', sku, 'units', units) order by units desc, sku) from top_skus), '[]'::jsonb),
  'routes', coalesce((select jsonb_agg(jsonb_build_object('source', source, 'destination', destination, 'transfers', transfers) order by transfers desc, source, destination) from routes), '[]'::jsonb),
  'recent', coalesce((select jsonb_agg(jsonb_build_object('reference', reference, 'source', source, 'destination', destination, 'items', items, 'completedAt', completed_at) order by completed_at desc) from recent), '[]'::jsonb),
  'lowStock', coalesce((select jsonb_agg(jsonb_build_object('bin', bin, 'sku', sku, 'quantity', quantity) order by quantity, bin, sku) from low_stock), '[]'::jsonb)
);
$$;

revoke all on function public.get_transfer_dashboard(integer) from public;
grant execute on function public.get_transfer_dashboard(integer) to anon;
