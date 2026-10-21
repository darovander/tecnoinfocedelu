-- Red de técnicos TecnoInformática
-- Pegar entero en Supabase > SQL Editor > New query > Run.
-- Se puede volver a correr sin romper nada: no borra datos.

-- ---------------------------------------------------------------
-- Administradores: quién ve y maneja todo desde el panel
-- ---------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
insert into public.admins (email) values ('dariodefazy@gmail.com')
on conflict (email) do nothing;

alter table public.admins enable row level security;
-- sin políticas: nadie la lee desde la web, solo la función de abajo

create or replace function public.es_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- El SQL Editor de Supabase y la service_role pueden todo;
-- desde la web solo un admin logueado.
create or replace function public.puede_todo()
returns boolean
language sql stable
as $$
  select current_user not in ('anon', 'authenticated') or public.es_admin();
$$;

-- ---------------------------------------------------------------
-- Comisiones generales (una sola fila)
--   deriva: el alumno le pasa un trabajo a TecnoInformática -> Dario le paga al alumno
--   recibe: TecnoInformática le pasa un trabajo al alumno   -> el alumno le paga a Dario
-- ---------------------------------------------------------------
create table if not exists public.config_comisiones (
  id int primary key default 1 check (id = 1),
  deriva_tipo text not null default 'porcentaje' check (deriva_tipo in ('porcentaje', 'fijo')),
  deriva_valor numeric not null default 10 check (deriva_valor >= 0),
  recibe_tipo text not null default 'porcentaje' check (recibe_tipo in ('porcentaje', 'fijo')),
  recibe_valor numeric not null default 10 check (recibe_valor >= 0),
  actualizado timestamptz not null default now()
);
insert into public.config_comisiones (id) values (1) on conflict (id) do nothing;

alter table public.config_comisiones enable row level security;
drop policy if exists "config: leer" on public.config_comisiones;
create policy "config: leer" on public.config_comisiones
  for select to authenticated using (true);
drop policy if exists "config: admin modifica" on public.config_comisiones;
create policy "config: admin modifica" on public.config_comisiones
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------
-- Técnicos (perfil de cada alumno)
-- ---------------------------------------------------------------
create table if not exists public.tecnicos (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nombre text not null check (char_length(nombre) between 2 and 80),
  slug text not null unique,
  zona text check (char_length(zona) <= 80),
  servicios text check (char_length(servicios) <= 600),
  descripcion text check (char_length(descripcion) <= 1200),
  horarios text check (char_length(horarios) <= 160),
  whatsapp text check (whatsapp ~ '^[0-9]{10,15}$'),
  foto_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'suspendido')),
  -- comisión propia de este alumno (vacío = usa la general)
  deriva_tipo text check (deriva_tipo in ('porcentaje', 'fijo')),
  deriva_valor numeric check (deriva_valor >= 0),
  recibe_tipo text check (recibe_tipo in ('porcentaje', 'fijo')),
  recibe_valor numeric check (recibe_valor >= 0),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create or replace function public.slug_libre(base text, propio uuid)
returns text
language plpgsql stable security definer
set search_path = public
as $$
declare
  limpio text;
  candidato text;
  n int := 1;
begin
  limpio := lower(translate(coalesce(base, ''), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'));
  limpio := trim(both '-' from regexp_replace(limpio, '[^a-z0-9]+', '-', 'g'));
  if limpio = '' then limpio := 'tecnico'; end if;
  limpio := left(limpio, 50);
  candidato := limpio;
  while exists (select 1 from public.tecnicos where slug = candidato and id <> propio) loop
    n := n + 1;
    candidato := limpio || '-' || n;
  end loop;
  return candidato;
end;
$$;

create or replace function public.tecnicos_proteger()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.slug := public.slug_libre(new.nombre, new.id);
    if not public.puede_todo() then
      new.email := auth.jwt() ->> 'email';
      new.estado := 'pendiente';
      new.deriva_tipo := null; new.deriva_valor := null;
      new.recibe_tipo := null; new.recibe_valor := null;
    end if;
  else
    if not public.puede_todo() then
      new.id := old.id;
      new.email := old.email;
      new.slug := old.slug;
      new.estado := old.estado;
      new.deriva_tipo := old.deriva_tipo; new.deriva_valor := old.deriva_valor;
      new.recibe_tipo := old.recibe_tipo; new.recibe_valor := old.recibe_valor;
    end if;
    new.creado := old.creado;
  end if;
  new.actualizado := now();
  return new;
end;
$$;

drop trigger if exists tecnicos_proteger on public.tecnicos;
create trigger tecnicos_proteger before insert or update on public.tecnicos
  for each row execute function public.tecnicos_proteger();

alter table public.tecnicos enable row level security;
drop policy if exists "tecnicos: ver el propio o admin" on public.tecnicos;
create policy "tecnicos: ver el propio o admin" on public.tecnicos
  for select to authenticated using (id = auth.uid() or public.es_admin());
drop policy if exists "tecnicos: crear el propio" on public.tecnicos;
create policy "tecnicos: crear el propio" on public.tecnicos
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "tecnicos: editar el propio o admin" on public.tecnicos;
create policy "tecnicos: editar el propio o admin" on public.tecnicos
  for update to authenticated using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());
drop policy if exists "tecnicos: admin borra" on public.tecnicos;
create policy "tecnicos: admin borra" on public.tecnicos
  for delete to authenticated using (public.es_admin());

-- Lo único que ve el público: perfiles aprobados, sin datos internos
create or replace function public.red_publica()
returns table (
  nombre text, slug text, zona text, servicios text,
  descripcion text, horarios text, whatsapp text, foto_url text
)
language sql stable security definer
set search_path = public
as $$
  select nombre, slug, zona, servicios, descripcion, horarios, whatsapp, foto_url
  from public.tecnicos
  where estado = 'aprobado'
  order by nombre;
$$;

-- ---------------------------------------------------------------
-- Trabajos derivados en los dos sentidos
-- ---------------------------------------------------------------
create table if not exists public.trabajos (
  id bigint generated always as identity primary key,
  sentido text not null check (sentido in ('deriva', 'recibe')),
  tecnico_id uuid not null references public.tecnicos (id) on delete cascade,
  cliente_nombre text check (char_length(cliente_nombre) <= 120),
  cliente_telefono text check (char_length(cliente_telefono) <= 40),
  equipo text not null check (char_length(equipo) between 2 and 160),
  falla text check (char_length(falla) <= 1000),
  estado text not null default 'recibido' check (estado in ('recibido', 'en_reparacion', 'entregado', 'cancelado')),
  monto numeric check (monto >= 0),
  comision numeric,
  comision_pagada boolean not null default false,
  notas text check (char_length(notas) <= 1000),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists trabajos_tecnico on public.trabajos (tecnico_id);

create or replace function public.calcular_comision(p_tecnico uuid, p_sentido text, p_monto numeric, p_estado text)
returns numeric
language plpgsql stable security definer
set search_path = public
as $$
declare
  tipo text;
  valor numeric;
begin
  if p_estado = 'cancelado' then return 0; end if;
  if p_sentido = 'deriva' then
    select coalesce(t.deriva_tipo, c.deriva_tipo), coalesce(t.deriva_valor, c.deriva_valor)
      into tipo, valor
      from public.tecnicos t, public.config_comisiones c
      where t.id = p_tecnico and c.id = 1;
  else
    select coalesce(t.recibe_tipo, c.recibe_tipo), coalesce(t.recibe_valor, c.recibe_valor)
      into tipo, valor
      from public.tecnicos t, public.config_comisiones c
      where t.id = p_tecnico and c.id = 1;
  end if;
  if valor is null then return null; end if;
  if tipo = 'fijo' then return valor; end if;
  if p_monto is null then return null; end if;
  return round(p_monto * valor / 100, 2);
end;
$$;

create or replace function public.trabajos_proteger()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.puede_todo() then
      if new.tecnico_id is distinct from auth.uid() or new.sentido <> 'deriva' then
        raise exception 'Solo podés cargar trabajos que vos derivás';
      end if;
      if not exists (select 1 from public.tecnicos where id = auth.uid() and estado = 'aprobado') then
        raise exception 'Tu perfil todavía no está aprobado';
      end if;
      new.estado := 'recibido';
      new.monto := null;
      new.notas := null;
      new.comision_pagada := false;
    end if;
  else
    if not public.puede_todo() then
      if old.sentido = 'deriva' then
        raise exception 'Este trabajo lo actualiza TecnoInformática';
      end if;
      -- en un trabajo que recibió, el alumno solo cambia estado y monto
      new.id := old.id;
      new.sentido := old.sentido;
      new.tecnico_id := old.tecnico_id;
      new.cliente_nombre := old.cliente_nombre;
      new.cliente_telefono := old.cliente_telefono;
      new.equipo := old.equipo;
      new.falla := old.falla;
      new.notas := old.notas;
      new.comision_pagada := old.comision_pagada;
      new.comision := old.comision;
    end if;
    new.creado := old.creado;
  end if;

  -- la comisión se congela una vez pagada
  if not (tg_op = 'UPDATE' and old.comision_pagada and new.comision_pagada) then
    new.comision := public.calcular_comision(new.tecnico_id, new.sentido, new.monto, new.estado);
  end if;
  new.actualizado := now();
  return new;
end;
$$;

drop trigger if exists trabajos_proteger on public.trabajos;
create trigger trabajos_proteger before insert or update on public.trabajos
  for each row execute function public.trabajos_proteger();

alter table public.trabajos enable row level security;
drop policy if exists "trabajos: ver los propios o admin" on public.trabajos;
create policy "trabajos: ver los propios o admin" on public.trabajos
  for select to authenticated using (tecnico_id = auth.uid() or public.es_admin());
drop policy if exists "trabajos: crear" on public.trabajos;
create policy "trabajos: crear" on public.trabajos
  for insert to authenticated with check (tecnico_id = auth.uid() or public.es_admin());
drop policy if exists "trabajos: editar" on public.trabajos;
create policy "trabajos: editar" on public.trabajos
  for update to authenticated using (tecnico_id = auth.uid() or public.es_admin())
  with check (tecnico_id = auth.uid() or public.es_admin());
drop policy if exists "trabajos: admin borra" on public.trabajos;
create policy "trabajos: admin borra" on public.trabajos
  for delete to authenticated using (public.es_admin());

-- ---------------------------------------------------------------
-- Permisos (las políticas de arriba deciden qué fila ve cada uno)
-- ---------------------------------------------------------------
revoke all on public.admins from anon, authenticated;
revoke all on public.tecnicos, public.trabajos, public.config_comisiones from anon;
grant select, insert, update, delete on public.tecnicos, public.trabajos to authenticated;
grant select, update on public.config_comisiones to authenticated;

revoke all on function public.es_admin() from public;
revoke all on function public.red_publica() from public;
-- estas dos las usan los triggers cuando escribe un usuario logueado
revoke all on function public.slug_libre(text, uuid) from public, anon;
revoke all on function public.calcular_comision(uuid, text, numeric, text) from public, anon;
grant execute on function public.slug_libre(text, uuid) to authenticated;
grant execute on function public.calcular_comision(uuid, text, numeric, text) to authenticated;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.red_publica() to anon, authenticated;
grant execute on function public.puede_todo() to anon, authenticated;

-- ---------------------------------------------------------------
-- Fotos de perfil: cada alumno sube solo a su carpeta, 2 MB máximo
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-tecnicos', 'fotos-tecnicos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "fotos-tecnicos: subir la propia" on storage.objects;
create policy "fotos-tecnicos: subir la propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-tecnicos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "fotos-tecnicos: borrar la propia" on storage.objects;
create policy "fotos-tecnicos: borrar la propia" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-tecnicos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------
-- Precios de referencia: los edita Dario, los ven solo los técnicos aprobados
-- ---------------------------------------------------------------
create or replace function public.es_aprobado()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.tecnicos where id = auth.uid() and estado = 'aprobado');
$$;
revoke all on function public.es_aprobado() from public, anon;
grant execute on function public.es_aprobado() to authenticated;

create table if not exists public.precios (
  id bigint generated always as identity primary key,
  categoria text not null default 'General' check (char_length(categoria) between 1 and 60),
  servicio text not null check (char_length(servicio) between 2 and 120),
  desde numeric check (desde >= 0),
  hasta numeric check (hasta >= 0),
  nota text check (char_length(nota) <= 200),
  actualizado timestamptz not null default now()
);

alter table public.precios enable row level security;
drop policy if exists "precios: ver aprobados o admin" on public.precios;
create policy "precios: ver aprobados o admin" on public.precios
  for select to authenticated using (public.es_aprobado() or public.es_admin());
drop policy if exists "precios: admin crea" on public.precios;
create policy "precios: admin crea" on public.precios
  for insert to authenticated with check (public.es_admin());
drop policy if exists "precios: admin edita" on public.precios;
create policy "precios: admin edita" on public.precios
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "precios: admin borra" on public.precios;
create policy "precios: admin borra" on public.precios
  for delete to authenticated using (public.es_admin());

revoke all on public.precios from anon;
grant select, insert, update, delete on public.precios to authenticated;

-- Lista inicial para completar (sin precios: los pone Dario desde su panel)
insert into public.precios (categoria, servicio, nota)
select v.categoria, v.servicio, v.nota
from (values
  ('Diagnóstico', 'Diagnóstico de PC o notebook', 'Se descuenta si el cliente hace la reparación'),
  ('Software', 'Formateo e instalación de Windows con drivers', null),
  ('Software', 'Instalación de programas / Office', null),
  ('Software', 'Eliminación de virus y optimización', null),
  ('Mantenimiento', 'Limpieza interna y pasta térmica (notebook)', null),
  ('Mantenimiento', 'Limpieza interna y pasta térmica (PC)', null),
  ('Hardware', 'Cambio de disco a SSD con clonado', 'Mano de obra, sin el disco'),
  ('Hardware', 'Ampliación de memoria RAM', 'Mano de obra, sin la memoria'),
  ('Hardware', 'Cambio de pantalla de notebook', 'Mano de obra, sin la pantalla'),
  ('Hardware', 'Cambio de teclado de notebook', 'Mano de obra, sin el teclado'),
  ('Hardware', 'Armado de PC', null)
) as v(categoria, servicio, nota)
where not exists (select 1 from public.precios);
