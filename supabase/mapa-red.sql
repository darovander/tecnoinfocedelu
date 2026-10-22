-- Mapa de la red de técnicos: cada técnico elige si aparece.
-- Pegalo en Supabase > SQL Editor > Run. Se puede correr más de una vez sin problema.

alter table public.tecnicos add column if not exists mostrar_en_mapa boolean not null default false;
alter table public.tecnicos add column if not exists lat double precision check (lat between -90 and 90);
alter table public.tecnicos add column if not exists lng double precision check (lng between -180 and 180);

-- Las coordenadas solo salen al público si el técnico eligió aparecer.
drop function if exists public.red_publica();
create function public.red_publica()
returns table (
  nombre text, slug text, zona text, servicios text,
  descripcion text, horarios text, whatsapp text, foto_url text,
  localidad text, punto_recepcion boolean,
  destacado text, instagram text, facebook text, aviso_presupuesto text,
  mostrar_presupuesto boolean, disponible boolean, direccion text,
  mostrar_en_mapa boolean, lat double precision, lng double precision
)
language sql stable security definer
set search_path = public
as $$
  select nombre, slug, zona, servicios, descripcion, horarios, whatsapp, foto_url,
         localidad, punto_recepcion,
         destacado, instagram, facebook, aviso_presupuesto,
         mostrar_presupuesto, disponible, direccion,
         mostrar_en_mapa,
         case when mostrar_en_mapa then lat end,
         case when mostrar_en_mapa then lng end
  from public.tecnicos
  where estado = 'aprobado'
  order by nombre;
$$;

revoke all on function public.red_publica() from public;
grant execute on function public.red_publica() to anon, authenticated;
