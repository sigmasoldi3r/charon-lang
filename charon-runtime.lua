--[[
MIT License

Copyright (c) 2020 Pablo Blanco Celdrán

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
]]
--[[
  Charon language standard library runtime.
]]
local charon = {}

local function strcat(this, other) return tostring(this) .. other; end

-- Unit type
charon.Unit = setmetatable({}, {
  __tostring = function() return 'Unit'; end,
  __concat = strcat,
  __call = function() error 'Attempting to call unit value!'; end
})
charon.True = true
charon.False = false

local Symbol = {
  __tostring = function(self) return ':' .. self.value; end,
  __concat = strcat
};
local symbols = {};

function charon.symbol(value)
  if symbols[value] ~= nil then return symbols[value]; end
  local symbol = setmetatable({ value = value }, Symbol);
  symbols[value] = symbol;
  return symbol;
end

function charon.type(value)
  if value == charon.Unit then
    return charon.symbol'unit';
  end
  local type = type(value);
  if type == 'number' then
    return charon.symbol'number';
  elseif type == 'string' then
    return charon.symbol'string';
  elseif type == 'table' then
    local meta = getmetatable(value);
    if meta == List then
      return charon.symbol'list';
    elseif meta == Table then
      return charon.symbol'table';
    elseif meta == Symbol then
      return charon.symbol'symbol';
    elseif meta == Atom then
      return charon.symbol'atom';
    else
      return charon.symbol'object';
    end
  else
    return charon.symbol'nothing';
  end
end

function charon.is(value, symbol)
  return charon.type(value) == symbol;
end

function charon.some(value)
  return value ~= nil and value ~= charon.Unit;
end

function charon.in_args(value, ...)
  for _, v in pairs{...} do
    if value == v then
      return true;
    end
  end
  return false;
end

function charon.is_nothing(value)
  return value == nil;
end

function charon.is_unit(value)
  return value == charon.Unit;
end

function charon.isnt_nothing(value)
  return value ~= nil;
end

function charon.isnt_unit(value)
  return value ~= charon.Unit;
end

local Atom = {
  __tostring = function(self)
    return 'atom{' .. tostring(self.value) .. '}';
  end,
  __concat = strcat
}

function charon.atom(value)
  return setmetatable({ value = value }, Atom);
end

local List = {
  __tostring = function(self)
    local list = ''
    for i=1, (#self - 1) do
      list = list .. tostring(self[i]) .. ' ';
    end
    return '[ ' .. list .. tostring(self[#self]) .. ' ]'
  end,
  __concat = strcat
}

function charon.list(tbl)
  return setmetatable(tbl, List)
end

local EQ = function(a, b) return a == b; end

function charon.list_find(tbl, what, finder)
  finder = finder or EQ;
  for _, v in pairs(tbl) do
    if finder(v, what) then
      return v;
    end
  end
  return charon.Unit;
end

function charon.list_has(tbl, element, finder)
  finder = finder or EQ;
  for _, v in pairs(tbl) do
    if finder(v, element) then
      return true;
    end
  end
  return false;
end

function charon.list_get(tbl, key)
  assert(getmetatable(tbl) == List, "list/get only accepts vectors.");
  assert(type(key) == 'number', "list/get key can only be numeric.");
  local field = tbl[key];
  if field == nil then return charon.Unit; end
  return field;
end

function charon.list_merge(left, right)
  assert(getmetatable(left) == List, "list/merge only accepts vectors.");
  assert(getmetatable(right) == List, "list/merge only accepts vectors.");
  local vec = charon.vector{};
  for _, v in pairs(left) do
    vec[#vec + 1] = v;
  end
  for _, v in pairs(right) do
    vec[#vec + 1] = v;
  end
  return tbl;
end

function charon.list_len(left)
  assert(getmetatable(left) == List, "list/add only accepts vectors.");
  return #left;
end

function charon.list_reduce_indexed(vec, fn, value)
  assert(getmetatable(vec) == List, "list/reduce-indexed only accepts vectors.");
  local start = 1;
  if value == nil then
    start = 2;
    value = vec[1];
  end
  for i=start, #vec do
    value = fn(value, vec[i], i);
  end
  return value;
end

function charon.list_reduce(vec, fn, value)
  assert(getmetatable(vec) == List, "list/reduce only accepts vectors.");
  local start = 1;
  if value == nil then
    start = 2;
    value = vec[1];
  end
  for i=start, #vec do
    value = fn(value, vec[i]);
  end
  return value;
end

function charon.list_append(left, ...)
  assert(getmetatable(left) == List, "list/append only accepts vectors.");
  local vec = charon.vector{};
  for _, v in pairs(left) do
    vec[#vec + 1] = v;
  end
  for _, v in pairs{...} do
    vec[#vec + 1] = v;
  end
  return vec;
end

function charon.list_prepend(left, ...)
  assert(getmetatable(left) == List, "list/prepend only accepts vectors.");
  local vec = charon.vector{};
  for _, v in pairs(left) do
    vec[#vec + 1] = v;
  end
  for _, v in pairs{...} do
    vec[#vec + 1] = v;
  end
  return vec;
end

function charon.list_drop(left, n)
  assert(getmetatable(left) == List, "list/drop only accepts vectors.");
  assert(type(n) == 'number', "list/drop second argument must be a number.");
  local vec = charon.vector{};
  local min = math.min(#left, n);
  for i=1, min do
    vec[i] = left[i];
  end
  return vec;
end

function charon.list_drop_left(left, n)
  assert(getmetatable(left) == List, "list/drop-left only accepts vectors.");
  assert(type(n) == 'number', "list/drop-left second argument must be a number.");
  local vec = charon.vector{};
  local min = math.min(#left, n);
  for i=min, #left do
    vec[i] = left[i];
  end
  return vec;
end

function charon.list_map(tbl, mapper)
  assert(getmetatable(tbl) == List, "list/map only accepts vectors.");
  local vec = charon.vector{};
  for k, v in pairs(tbl) do
    vec[#vec + 1] = mapper(v, k);
  end
  return vec;
end

function charon.list_filter(tbl, filter)
  assert(getmetatable(tbl) == List, "list/map only accepts vectors.");
  local vec = charon.vector{};
  for k, v in pairs(tbl) do
    if filter(v, k) then
      vec[#vec + 1] = v;
    end
  end
  return vec;
end

function charon.list_each(tbl, consumer)
  assert(getmetatable(tbl) == List, "list/each only accepts vectors.");
  for k, v in pairs(tbl) do
    consumer(v, k);
  end
  return charon.Unit;
end

local Table = {
  __tostring = function(self)
    local paired = '';
    for k, v in pairs(self) do
      paired = paired .. tostring(k) .. ' ' .. tostring(v) .. ', ';
    end
    return '{ ' .. paired .. ' }';
  end,
  __concat = strcat
}

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
  return charon.Unit;
end

function charon.atom_apply(atom, func, ...)
  atom.value = func(atom.value, ...);
  return atom.value;
end

function charon.table_get(key, tbl)
  assert(getmetatable(tbl) == Table, "table/get only accepts tables.");
  local field = tbl[key];
  if field == nil then return charon.Unit; end
  return field;
end

function charon.table_merge(left, right)
  assert(getmetatable(left) == Table, "table/merge only accepts tables.");
  assert(getmetatable(right) == Table, "table/merge only accepts tables.");
  local tbl = charon.table{};
  for k, v in pairs(left) do
    tbl[k] = v;
  end
  for k, v in pairs(right) do
    tbl[k] = v;
  end
  return tbl;
end

function charon.table_remove(tbl, ...)
  assert(getmetatable(tbl) == Table, "table/remove only accepts tables.");
  local keys = {};
  for _, key in pairs{...} do
    keys[key] = key;
  end
  local out = charon.table{};
  for k, v in pairs(tbl) do
    if keys[k] ~= nil then
      out[k] = v;
    end
  end
  return out;
end

function charon.object_new_raw(proto)
  local tbl = {};
  for k, v in pairs(proto) do
    if type(v) == 'table' then
      tbl[k] = charon.object_new_raw(v);
    else
      tbl[k] = v;
    end
  end
  return tbl;
end

function charon.object_new(proto)
  local tbl = {};
  for k, v in pairs(proto) do
    local key = k;
    if type(key) == 'table' and getmetatable(key) == Symbol then
      key = tostring(key);
    end
    if type(v) == 'table' then
      tbl[key] = charon.object_new(v);
    else
      tbl[key] = v;
    end
  end
  return tbl;
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
  assert(fn ~= charon.Unit, 'Unit is not callable!');
  return fn(...);
end

function charon.apply(fn, args)
  assert(fn ~= charon.Unit, 'Unit is not callable!');
  return fn(table.unpack(args));
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
  return charon.Unit;
end

function charon.file_write(file, what)
  file:write(what);
  return charon.Unit;
end

function charon.file_read(file)
  return file:read(what);
end

function charon.compose(a, b)
  return function(...)
    return b(a(...));
  end
end

function charon.or_coalesce(test, val)
  if test == nil or test == charon.Unit then
    return val;
  end
  return test;
end

function charon.str(...)
  local out = '';
  for _, v in pairs{...} do
    out = out .. tostring(v);
  end
  return out;
end

function charon.range(from, to, inc)
  assert(type(from) == 'number' and type(to) == 'number'
    , 'Range function expects numeric input only!')
  assert(inc == nil or type(inc) == 'number'
    , 'Range\'s third argument can only be a number or not provided. Saw ' .. tostring(inc) .. ' instead.')
  if inc == nil then inc = 1; end
  local p = {};
  local j = 1;
  if from > to then
    for i=from, to, -inc do
      p[j] = i;
      j = j + 1;
    end
  elseif from == to then
    return p;
  else
    for i=from, to, inc do
      p[j] = i;
      j = j + 1;
    end
  end
  return p;
end

-- Functions

-- Mapping for macro +
function charon.plus(result, ...)
  for _, v in pairs{...} do
    result = result + v;
  end
  return result;
end

-- Mapping for macro -
function charon.minus(result, ...)
  for _, v in pairs{...} do
    result = result - v;
  end
  return result;
end

-- Mapping for macro /
function charon.div(result, ...)
  for _, v in pairs{...} do
    result = result / v;
  end
  return result;
end

-- Mapping for macro *
function charon.mul(result, ...)
  for _, v in pairs{...} do
    result = result * v;
  end
  return result;
end

-- Mapping for macro ^
function charon.pow(result, ...)
  for _, v in pairs{...} do
    result = result ^ v;
  end
  return result;
end

-- Mapping for macro =
function charon.eq(l, r, ...)
  local result = l == r;
  for _, il in pairs{...} do
    for _, ir in pairs{...} do
      result = result and il == ir;
    end
  end
end

-- Mapping for macro <>
function charon.neq(l, r, ...)
  local result = l ~= r;
  for _, il in pairs{...} do
    for _, ir in pairs{...} do
      result = result and il ~= ir;
    end
  end
  return result;
end

-- Mapping for macro >
function charon.gt(l, r, ...)
  local result = l > r;
  for _, il in pairs{...} do
    for _, ir in pairs{...} do
      result = result and il > ir;
    end
  end
  return result;
end

-- Mapping for macro <
function charon.lt(l, r, ...)
  local result = l < r;
  for _, il in pairs{...} do
    for _, ir in pairs{...} do
      result = result and il < ir;
    end
  end
  return result;
end

-- Mapping for macro >=
function charon.gteq(l, r, ...)
  local result = l >= r;
  for _, il in pairs{...} do
    for _, ir in pairs{...} do
      result = result and il >= ir;
    end
  end
  return result;
end

-- Mapping for macro <=
function charon.lteq(l, r, ...)
  local result = l <= r;
  for _, il in pairs{...} do
    for _, ir in pairs{...} do
      result = result and il <= ir;
    end
  end
  return result;
end

-- Mapping for macro and
function charon._and(result, ...)
  for _, v in pairs{...} do
    result = result and v;
  end
  return result;
end

-- Mapping for macro or
function charon._or(result, ...)
  for _, v in pairs{...} do
    result = result or v;
  end
  return result;
end

-- Mapping for macro not
function charon._not(value)
  return not value;
end

-- Mapping for macro nand
function charon.nand(...)
  return not charon._and(...);
end

-- Mapping for macro nor
function charon.nor(...)
  return not charon._or(...);
end

-- Mapping for macro xor
function charon.xor(...)
  error('Not implemented');
end

-- Namespace.
return charon;
