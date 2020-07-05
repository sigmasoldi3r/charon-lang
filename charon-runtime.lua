--[[
  Charon language standard library runtime.
]]
charon = {}

-- Unit type
charon.Unit = setmetatable({}, {
  __tostring = function() return 'Unit'; end,
  __concat = function(this, other) return tostring(this) .. other; end
})
charon.True = true
charon.False = false

function charon.some(value)
  return value ~= nil and value ~= charon.Unit
end

local atom = {}

function charon.atom(value)
  return setmetatable({ value = value }, Atom)
end

local Vector = {}

function charon.vector(tbl)
  return setmetatable(tbl, Vector)
end

function charon.vector_map(tbl, mapper)
  assert(getmetatable(tbl) == Vector, "vector/map only accept vectors.");
  local vec = charon.vector{}
  for _, v in pairs(tbl) do
    vec[#vec + 1] = mapper(v);
  end
  return vec
end

local Table = {}

function charon.table(tbl)
  return setmetatable(tbl, Table)
end

function charon.println(...)
  print(...);
end

function charon.print(...)
  for _, v in pairs{...} do
    io.write(v);
  end
end

function charon.atom_get(atom)
  return atom.value;
end

function charon.atom_set(atom, value)
  atom.value = value;
end

function charon.get(key, object)
  local field = object[key]
  if field == nil then return charon.Unit; end
  return field;
end

function charon.call(fn, ...)
  if fn == charon.Unit then
    error('Unit is not callable!');
  end
  return fn(...);
end

function charon.opaque_call(fn)
  if fn == charon.Unit then
    error('Unit is not callable!');
  end
  fn();
  return charon.Unit;
end

function charon.file_open(file, mode)
  return io.open(file, mode) or charon.Unit;
end

function charon.file_close(file)
  io.close(file);
end

function charon.file_write(file, what)
  file:write(what);
end

function charon.file_read(file)
  return file:read(what);
end
