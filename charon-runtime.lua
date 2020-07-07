--[[
  Charon language standard library runtime.
]]
local charon = {}

-- Unit type
charon.Unit = setmetatable({}, {
  __tostring = function() return 'Unit'; end,
  __concat = function(this, other) return tostring(this) .. other; end
})
charon.True = true
charon.False = false

local Symbol = {
  __tostring = function(self) return ':' .. self.value; end,
  __concat = function(this, other) return tostring(this) .. other; end
};
local symbols = {};

function charon.symbol(value)
  if symbols[value] ~= nil then return symbols[value]; end
  local symbol = setmetatable({ value = value }, Symbol);
  symbols[value] = symbol;
  return symbol;
end

function charon.some(value)
  return value ~= nil and value ~= charon.Unit;
end

local atom = {}

function charon.atom(value)
  return setmetatable({ value = value }, Atom);
end

local Vector = {
  __tostring = function(self)
    local list = ''
    for i=1, (#self - 1) do
      list = list .. tostring(self[i]) .. ', ';
    end
    return '[' .. list .. tostring(self[#self]) .. ']'
  end
}

function charon.vector(tbl)
  return setmetatable(tbl, Vector)
end

function charon.vector_map(tbl, mapper)
  assert(getmetatable(tbl) == Vector, "vector/map only accepts vectors.");
  local vec = charon.vector{}
  for k, v in pairs(tbl) do
    vec[#vec + 1] = mapper(v, k);
  end
  return vec
end

function charon.vector_each(tbl, consumer)
  assert(getmetatable(tbl) == Vector, "vector/each only accepts vectors.");
  for k, v in pairs(tbl) do
    consumer(v, k);
  end
  return charon.Unit;
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

function charon.table_get(tbl, key)
  assert(getmetatable(tbl) == Table, "table/each only accepts tables.");
  local field = tbl[key];
  if field == nil then return charon.Unit; end
  return field;
end

function charon.table_set(tbl, key, value)
  assert(getmetatable(tbl) == Table, "table/set only accepts tables.");
  tbl[key] = value;
end

function charon.object_get(object, key)
  local field = object[key];
  if field == nil then return charon.Unit; end
  return field;
end

function charon.object_set(object, key, value)
  if getmetatable(key) == Table then
    for k, v in pairs(key) do
      if getmetatable(k) == Symbol then
        object[k.value] = v
      else
        object[k] = v
      end
    end
  else
    object[key] = value;
  end
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

return charon;
