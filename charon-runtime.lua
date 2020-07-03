--[[
  Charon language standard library runtime.
]]
charon = {}

function charon.atom(value)
  return { value = value }
end

function charon.vector(tbl)
  return tbl
end

function charon.table(tbl)
  return tbl
end

function charon.println(...)
  print(...);
end

function charon.get(atom)
  return atom.value;
end

function charon.set(atom, value)
  atom.value = value;
end

function charon.opaque_call(fn)
  fn();
end

function charon.plus(...)
  local accum = 0;
  for _, v in pairs{...} do
    accum = accum + v;
  end
  return accum;
end

function charon.min(...)
  local accum = 0;
  for _, v in pairs{...} do
    accum = accum - v;
  end
  return accum;
end

function charon.div(...)
  local accum = 0;
  for _, v in pairs{...} do
    accum = accum / v;
  end
  return accum;
end

function charon.mul(...)
  local accum = 0;
  for _, v in pairs{...} do
    accum = accum / v;
  end
  return accum;
end
