-- Registra no banco todos os ativos que a tela de trade oferece.
--
-- open_trade_atomic exige que o ativo exista em otc_symbols (OTC) ou em asset_settings
-- (mercado aberto). Só 5 ativos OTC estavam cadastrados, então os demais eram recusados com
-- ASSET_DISABLED ("Ativo indisponível para negociação") mesmo aparecendo na lista.

begin;

-- asset_settings usava "EURUSD-OTC", mas a tela e o admin leem "EURUSD_OTC": o payout e o
-- liga/desliga definidos ali nunca chegavam na interface.
update public.asset_settings s
set symbol = replace(s.symbol, '-', '_'), updated_at = now()
where s.symbol like '%-OTC'
  and not exists (
    select 1 from public.asset_settings t where t.symbol = replace(s.symbol, '-', '_')
  );

insert into public.otc_symbols (symbol, name, category, base_price, volatility, payout_percentage, is_active)
select v.symbol, v.name, v.category, v.base_price, v.volatility, v.payout, true
from (values
  ('USDBRL_OTC',  'USD/BRL OTC',    'forex',  5.42,       34,  92),
  ('SPACEX_OTC',  'SpaceXCoin OTC', 'crypto', 18.75,      130, 90),
  ('TRUMP_OTC',   'TRUMP Coin OTC', 'crypto', 9.4,        120, 90),
  ('AMZN_OTC',    'Amazon OTC',     'stocks', 178.5,      60,  92),
  ('PENUSD_OTC',  'PEN/USD OTC',    'forex',  0.267,      28,  92),
  ('ONDO_OTC',    'Ondo OTC',       'crypto', 1.18,       110, 90),
  ('SHIBUSD_OTC', 'SHIB/USD OTC',   'crypto', 0.0000245,  140, 90),
  ('TSLA_OTC',    'Tesla OTC',      'stocks', 248.6,      70,  92),
  ('PEPE_OTC',    'Pepe OTC',       'crypto', 0.0000118,  160, 90),
  ('META_OTC',    'Meta OTC',       'stocks', 482.3,      65,  92),
  ('DOGE_OTC',    'DogeCoin OTC',   'crypto', 0.162,      135, 90),
  ('GBPJPY_OTC',  'GBP/JPY OTC',    'forex',  189.5,      45,  96),
  ('EURJPY_OTC',  'EUR/JPY OTC',    'forex',  162.3,      42,  96),
  ('AUDJPY_OTC',  'AUD/JPY OTC',    'forex',  98.05,      40,  96)
) as v(symbol, name, category, base_price, volatility, payout)
where not exists (
  select 1 from public.otc_symbols o where replace(o.symbol, '-', '_') = v.symbol
);

insert into public.asset_settings (symbol, enabled, payout, sort_order)
select v.symbol, true, v.payout, v.sort_order
from (values
  ('EURUSD_OTC', 96, 0), ('GBPUSD_OTC', 96, 1), ('USDJPY_OTC', 96, 2), ('AUDUSD_OTC', 96, 3),
  ('BTCUSD_OTC', 96, 4), ('USDBRL_OTC', 92, 5), ('SPACEX_OTC', 90, 6), ('TRUMP_OTC', 90, 7),
  ('AMZN_OTC', 92, 8), ('PENUSD_OTC', 92, 9), ('ONDO_OTC', 90, 10), ('SHIBUSD_OTC', 90, 11),
  ('TSLA_OTC', 92, 12), ('PEPE_OTC', 90, 13), ('META_OTC', 92, 14), ('DOGE_OTC', 90, 15),
  ('GBPJPY_OTC', 96, 16), ('EURJPY_OTC', 96, 17), ('AUDJPY_OTC', 96, 18),
  ('EURUSD', 85, 19), ('GBPJPY', 85, 20), ('EURJPY', 85, 21), ('AUDUSD', 85, 22),
  ('AUDJPY', 85, 23), ('BTCUSD', 85, 24), ('GBPUSD', 85, 25), ('USDJPY', 85, 26),
  ('USDCHF', 85, 27), ('USDCAD', 85, 28), ('NZDUSD', 85, 29), ('EURGBP', 85, 30)
) as v(symbol, payout, sort_order)
where not exists (select 1 from public.asset_settings a where a.symbol = v.symbol);

commit;
