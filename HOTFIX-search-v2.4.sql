-- Greene Monitor V2.4.1 — hotfix da busca global
-- Pode ser executado isoladamente se o restante da migration V2.4 já tiver sido aplicado.

begin;

create or replace function public.search_my_greene(p_query text)
returns table(kind text, entity_id text, label text, detail text, event_date date)
language sql
security definer
set search_path = public, auth
as $$
  select x.kind, x.entity_id, x.label, x.detail, x.event_date
  from (
    select 'note'::text, n.id::text, n.title,
      array_to_string(n.tags,' ')::text, coalesce(n.linked_date,n.updated_at::date)
    from notes n
    where n.user_id=auth.uid()
      and (
        n.title ilike '%'||p_query||'%'
        or n.content ilike '%'||p_query||'%'
        or array_to_string(n.tags,' ') ilike '%'||p_query||'%'
      )

    union all

    select 'book', b.id::text, b.title, coalesce(b.author,'')::text,
      coalesce(b.finished_on,b.started_on,b.created_at::date)
    from books b
    where b.user_id=auth.uid()
      and (
        b.title ilike '%'||p_query||'%'
        or coalesce(b.author,'') ilike '%'||p_query||'%'
        or coalesce(b.notes,'') ilike '%'||p_query||'%'
      )

    union all

    select 'study', s.id::text, s.subject, coalesce(s.learned,'')::text, s.date
    from studies s
    where s.user_id=auth.uid()
      and (
        s.subject ilike '%'||p_query||'%'
        or coalesce(s.learned,'') ilike '%'||p_query||'%'
      )

    union all

    select 'journal', j.id::text, coalesce(nullif(j.title,''),'Diário'),
      left(coalesce(j.body,''),180), j.date
    from journal_entries j
    where j.user_id=auth.uid()
      and (
        coalesce(j.title,'') ilike '%'||p_query||'%'
        or coalesce(j.body,'') ilike '%'||p_query||'%'
        or array_to_string(j.tags,' ') ilike '%'||p_query||'%'
      )

    union all

    select 'goal', g.id::text, g.title, coalesce(g.notes,'')::text,
      coalesce(g.deadline,g.date)
    from goals g
    where g.user_id=auth.uid()
      and (
        g.title ilike '%'||p_query||'%'
        or coalesce(g.notes,'') ilike '%'||p_query||'%'
      )

    union all

    select 'habit', h.id::text, h.name, 'Hábito'::text, h.created_at::date
    from habits h
    where h.user_id=auth.uid()
      and h.name ilike '%'||p_query||'%'

    union all

    select 'exercise', e.id::text, e.activity, coalesce(e.note,'')::text, e.date
    from exercise_logs e
    where e.user_id=auth.uid()
      and (
        e.activity ilike '%'||p_query||'%'
        or coalesce(e.note,'') ilike '%'||p_query||'%'
      )

    union all

    select 'reading', r.id::text, b.title,
      (r.pages_read::text||' páginas')::text, r.date
    from reading_logs r
    join books b on b.id=r.book_id
    where r.user_id=auth.uid()
      and (
        b.title ilike '%'||p_query||'%'
        or coalesce(r.note,'') ilike '%'||p_query||'%'
      )
  ) as x(kind, entity_id, label, detail, event_date)
  order by x.event_date desc nulls last
  limit 40;
$$;

revoke all on function public.search_my_greene(text) from public;
grant execute on function public.search_my_greene(text) to authenticated;

commit;
