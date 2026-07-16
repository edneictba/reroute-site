-- REROUTE Portal Sprint 17 - finance RLS validation.
-- Run only in an isolated Supabase database after all migrations.

begin;

do $$
declare
  org_id uuid := (select id from public.organizations where slug = 'reroute');
  investor_workspace_id uuid := (
    select id from public.workspaces where organization_id = org_id and slug = 'investor'
  );
  finance_workspace_id uuid := (
    select id from public.workspaces where organization_id = org_id and slug = 'finance'
  );
begin
  if org_id is null or investor_workspace_id is null or finance_workspace_id is null then
    raise exception 'Required finance RLS fixtures are missing';
  end if;

  begin
    insert into public.financial_summaries (organization_id, workspace_id, current_cash)
    values (org_id, investor_workspace_id, -1);
    raise exception 'Negative financial summary value was not blocked';
  exception when check_violation then null;
  end;

  begin
    insert into public.financial_transactions (
      organization_id, workspace_id, transaction_date, type, category, description, amount
    ) values (
      org_id, finance_workspace_id, current_date, 'invalid', 'Teste', 'Registro ficticio', 1
    );
    raise exception 'Invalid transaction type was not blocked';
  exception when check_violation then null;
  end;
end;
$$;

rollback;

