# Browser Smoke Test Matrix

Use these five scenarios after starting the stack with either local dev servers or `docker compose up --build`. Enter each case through the browser UI and compare the result with Pokemon Showdown's calculator.

Common defaults unless stated otherwise:

- Attacker ability: blank
- Attacker item: blank
- Attacker status: `NONE`
- Defender ability: blank
- Defender item: blank
- Defender status: `NONE`
- Targets: single target
- Result mode: verify both `Range` and `Full 16 Rolls`

## Scenario 1: Special STAB baseline

Attacker:

- Level `50`
- Primary Type `FIRE`
- HP `141`
- Attack `69`
- Special Attack `154`
- Move Type `FIRE`
- Category `SPECIAL`
- Base Power `90`
- Critical Hit `off`

Defender:

- Level `50`
- Primary Type `GRASS`
- Secondary Type `None`
- HP `160`
- Defense `115`
- Special Defense `99`

Field:

- Weather `NONE`
- Terrain `NONE`
- Room `NONE`
- Reflect `off`
- Light Screen `off`
- Aurora Veil `off`
- Friend Guard `off`
- Helping Hand `off`

Expected result:

- Range `158 - 188`
- HP range `98.8% - 117.5%`
- Rolls `158, 162, 162, 164, 168, 168, 170, 170, 174, 176, 176, 180, 182, 182, 186, 188`

## Scenario 2: Sun boosts Fire

Use the same attacker and defender as Scenario 1.

Field:

- Weather `SUN`
- Terrain `NONE`
- Room `NONE`

Expected result:

- Range `236 - 282`
- HP range `147.5% - 176.3%`
- Rolls `236, 240, 242, 246, 248, 252, 254, 258, 260, 264, 266, 270, 272, 276, 278, 282`

## Scenario 3: Rain weakens Fire

Use the same attacker and defender as Scenario 1.

Field:

- Weather `RAIN`
- Terrain `NONE`
- Room `NONE`

Expected result:

- Range `78 - 92`
- HP range `48.8% - 57.5%`
- Rolls `78, 78, 78, 80, 80, 80, 84, 84, 84, 86, 86, 86, 90, 90, 90, 92`

## Scenario 4: Reflect reduces physical damage

Attacker:

- Level `50`
- Primary Type `NORMAL`
- HP `154`
- Attack `149`
- Special Attack `93`
- Move Type `NORMAL`
- Category `PHYSICAL`
- Base Power `80`
- Critical Hit `off`

Defender:

- Level `50`
- Primary Type `WATER`
- Secondary Type `None`
- HP `160`
- Defense `115`
- Special Defense `99`

Field:

- Weather `NONE`
- Terrain `NONE`
- Room `NONE`
- Reflect `on`
- Light Screen `off`
- Aurora Veil `off`
- Friend Guard `off`
- Helping Hand `off`

Expected result:

- Range `38 - 46`
- HP range `23.8% - 28.8%`
- Rolls `38, 40, 40, 40, 40, 42, 42, 42, 42, 44, 44, 44, 44, 46, 46, 46`

## Scenario 5: Critical hit ignores Reflect

Use the same attacker, defender, and field as Scenario 4, but turn `Critical Hit` on.

Expected result:

- Range `88 - 105`
- HP range `55.0% - 65.6%`
- Rolls `88, 90, 90, 91, 93, 94, 94, 96, 97, 97, 99, 100, 100, 102, 103, 105`
