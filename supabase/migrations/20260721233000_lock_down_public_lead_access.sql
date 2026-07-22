begin;

drop policy if exists "Allow public lead inserts" on public.leads;
revoke all on public.leads from public, anon, authenticated;
revoke all on public.lead_submission_attempts from public, anon, authenticated;
revoke all on sequence public.lead_submission_attempts_id_seq from public, anon, authenticated;
revoke all on function public.register_public_lead(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_public_lead(text, text, text, text, text)
  to service_role;

commit;
