/*
 * CHAIRMAN'S ADVENTURE — Native Game Boy Color (.gbc) Cartridge ROM
 * Starring Chairman (fluffy cream dog in a black quilted vest with red trim)
 * Compatible with ModRetro Chromatic, Game Boy Color (CGB), and Game Boy (DMG)
 *
 * Controls (ModRetro Chromatic / GBC):
 *   D-Pad Left / Right : Run
 *   A Button           : Jump (Double Jump supported!)
 *   B Button           : Throw Spinning Bone Boomerang
 *   START              : Start / Pause / Next Stage
 *   SELECT             : Stage Select on Title (1:LION, 2:TIGER, 3:ELEPHANT)
 */

#include <gb/gb.h>
#include <gb/cgb.h>
#include <stdint.h>
#include <stdbool.h>
#include "tiles.h"

#define STATE_TITLE      0
#define STATE_PLAYING    1
#define STATE_PAUSED     2
#define STATE_STAGECLEAR 3
#define STATE_GAMEOVER   4
#define STATE_VICTORY    5

#define LEVEL_TILES      64   /* 512px wide level */
#define LEVEL_PX         512
#define ARENA_CAM_X      352  /* 512 - 160 */
#define GROUND_Y         112  /* Tile row 14 (14 * 8) */

#define MAX_ENEMIES      6
#define MAX_TREATS       6
#define MAX_BOOMS        2
#define MAX_PROJS        4
#define MAX_QBLOCKS      6
#define MAX_PLATS        8

/* =========================================================================
 * HARDWARE CGB PALETTES (3 Stage Themes + 8 Sprite Palettes)
 * ========================================================================= */
/* BG Palettes per stage: [0:Sky/Cloud, 1:Grass/Dirt, 2:Brick/?Block, 3:HUD Text, 4:Hearts/BossBar] */
static const palette_color_t STAGE_BG_PALS[3][5 * 4] = {
    /* Stage 1: Sunny Meadow (Lion) */
    {
        RGB(14, 24, 31), RGB(31, 31, 31), RGB(22, 27, 31), RGB(3, 5, 9),   /* 0: Sky + White Cloud */
        RGB(14, 24, 31), RGB(8, 28, 10),  RGB(4, 20, 7),   RGB(18, 10, 4), /* 1: Green Grass + Dirt */
        RGB(14, 24, 31), RGB(31, 25, 4),  RGB(24, 13, 3),  RGB(10, 4, 2),  /* 2: Gold ? / Brick */
        RGB(31, 31, 31), RGB(31, 25, 4),  RGB(8, 26, 31),  RGB(3, 4, 8),   /* 3: HUD Text on Dark */
        RGB(31, 31, 31), RGB(31, 18, 18), RGB(31, 4, 7),   RGB(3, 4, 8)    /* 4: Red Hearts / Boss Bar */
    },
    /* Stage 2: Sunset Canyon (Tiger) */
    {
        RGB(31, 17, 7),  RGB(31, 29, 22), RGB(29, 21, 12), RGB(4, 3, 6),   /* 0: Sunset Sky */
        RGB(31, 17, 7),  RGB(7, 24, 9),   RGB(3, 16, 6),   RGB(15, 7, 3),  /* 1: Jungle Grass */
        RGB(31, 17, 7),  RGB(31, 26, 5),  RGB(22, 10, 2),  RGB(9, 3, 2),   /* 2: Brick / ?Block */
        RGB(31, 31, 31), RGB(31, 22, 5),  RGB(31, 13, 6),  RGB(4, 3, 6),   /* 3: HUD Text */
        RGB(31, 31, 31), RGB(31, 18, 18), RGB(31, 5, 7),   RGB(4, 3, 6)    /* 4: Hearts */
    },
    /* Stage 3: Royal Temple (Elephant) */
    {
        RGB(6, 7, 18),   RGB(22, 23, 31), RGB(14, 15, 26), RGB(2, 2, 6),   /* 0: Twilight Sky */
        RGB(6, 7, 18),   RGB(28, 22, 5),  RGB(20, 15, 4),  RGB(11, 10, 13),/* 1: Gold Temple Stone */
        RGB(6, 7, 18),   RGB(31, 27, 8),  RGB(20, 12, 26), RGB(7, 4, 12),  /* 2: Temple Brick */
        RGB(31, 31, 31), RGB(31, 25, 6),  RGB(24, 16, 31), RGB(2, 2, 6),   /* 3: HUD Text */
        RGB(31, 31, 31), RGB(31, 18, 18), RGB(31, 4, 8),   RGB(2, 2, 6)    /* 4: Hearts */
    }
};

/* 8 Hardware Sprite Palettes (color 0 is always transparent) */
static const palette_color_t SPR_PALS[8 * 4] = {
    /* 0: Chairman Head + Bone (1=cream white, 2=apricot ears, 3=dark brown eyes/nose) */
    RGB(0,0,0), RGB(31, 30, 27), RGB(29, 21, 11), RGB(8, 5, 4),
    /* 1: Chairman Vest (1=white paws/tail, 2=RED trim, 3=BLACK quilted vest) */
    RGB(0,0,0), RGB(31, 31, 29), RGB(30, 4, 5),   RGB(3, 3, 5),
    /* 2: Dog Treat (1=cream center, 2=golden/meat, 3=dark outline) */
    RGB(0,0,0), RGB(31, 29, 22), RGB(31, 18, 2),  RGB(12, 5, 2),
    /* 3: Mouse (1=light gray, 2=pink ear/tail, 3=dark gray) */
    RGB(0,0,0), RGB(22, 23, 25), RGB(31, 16, 22), RGB(7, 8, 10),
    /* 4: Cat & Lion (1=gold/cream, 2=amber orange, 3=dark brown) */
    RGB(0,0,0), RGB(31, 26, 8),  RGB(26, 12, 2),  RGB(8, 4, 2),
    /* 5: Tiger (1=white cheeks, 2=vivid orange, 3=black stripes) */
    RGB(0,0,0), RGB(31, 30, 28), RGB(31, 13, 2),  RGB(2, 2, 3),
    /* 6: Elephant (1=ivory tusk, 2=crimson blanket, 3=slate gray) */
    RGB(0,0,0), RGB(31, 31, 27), RGB(26, 3, 7),   RGB(12, 14, 18),
    /* 7: Boss Projectile (1=white core, 2=yellow/purple glow, 3=red/dark edge) */
    RGB(0,0,0), RGB(31, 31, 24), RGB(31, 22, 3),  RGB(26, 4, 8)
};

/* Upbeat Adventure Island chiptune notes (GB frequency values) */
static const uint16_t BGM_NOTES[32] = {
    1546, 1650, 1750, 1650, 1798, 1750, 1650, 1546,
    1602, 1673, 1798, 1750, 1650, 0,    1602, 0,
    1546, 1650, 1750, 1849, 1798, 1750, 1650, 1546,
    1602, 1650, 1546, 0,    1379, 0,    1546, 0
};

/* =========================================================================
 * DATA STRUCTURES
 * ========================================================================= */
typedef struct {
    int16_t x;
    int8_t  y;
    uint8_t w;
} Platform;

typedef struct {
    int16_t x;
    int8_t  y;
    uint8_t used;
} QBlock;

typedef struct {
    uint8_t active;
    uint8_t type; /* 0=mouse, 1=cat */
    int16_t x;
    int8_t  y;
    int8_t  vx;
    int8_t  vy;
    int16_t min_x;
    int16_t max_x;
    uint8_t hp;
    uint8_t hop_timer;
} Enemy;

typedef struct {
    uint8_t active;
    int16_t x;
    int8_t  y;
    int8_t  vy;
    uint8_t floating;
    int8_t  base_y;
} Treat;

typedef struct {
    uint8_t active;
    int16_t x;
    int8_t  y;
    int8_t  vx;
    int8_t  dir;
    uint8_t age;
    uint8_t returning;
    uint8_t hit_cd;
} Boomerang;

typedef struct {
    uint8_t active;
    int16_t x;
    int8_t  y;
    int8_t  vx;
    int8_t  vy;
    uint8_t gravity;
    uint8_t life;
} BossProj;

typedef struct {
    uint8_t active;
    uint8_t type; /* 0=lion, 1=tiger, 2=elephant */
    int16_t x;
    int8_t  y;
    int8_t  vx;
    int8_t  vy;
    int8_t  facing;
    uint8_t hp;
    uint8_t max_hp;
    uint8_t state;
    uint8_t timer;
    uint8_t hurt_flash;
    uint16_t treat_cd;
} Boss;

/* Globals */
static uint8_t is_cgb = 0;
static uint8_t game_state = STATE_TITLE;
static uint8_t stage_idx = 0; /* 0=Lion, 1=Tiger, 2=Elephant */
static uint16_t score = 0;
static uint8_t frame_cnt = 0;
static uint8_t prev_joy = 0;
static uint8_t bgm_on = 1;
static uint8_t bgm_step = 0;
static uint8_t bgm_timer = 0;

/* Camera & streaming tilemap state */
static int16_t cam_x = 0;
static uint8_t boss_locked = 0;
static uint8_t last_streamed_col = 0;

/* Chairman (Hero) — 16x16 */
static int16_t px = 24;
static int16_t py_fp = (GROUND_Y - 16) << 4; /* 4-bit fixed point Y for silky jump arc */
static int16_t pvy_fp = 0;
static int8_t  pfacing = 1;
static uint8_t pjumps = 2;
static uint8_t php = 5;
static uint8_t pinvul = 0;
static uint8_t pthrow_cd = 0;
static uint8_t pwalk_cnt = 0;

static Platform plats[MAX_PLATS];
static uint8_t  plat_cnt = 0;
static QBlock   qblocks[MAX_QBLOCKS];
static uint8_t  qblock_cnt = 0;
static Enemy    enemies[MAX_ENEMIES];
static Treat    treats[MAX_TREATS];
static Boomerang booms[MAX_BOOMS];
static BossProj projs[MAX_PROJS];
static Boss     boss;

/* =========================================================================
 * HARDWARE AUDIO (GBC APU)
 * ========================================================================= */
static void sound_init(void) {
    NR52_REG = 0x80;
    NR50_REG = 0x77;
    NR51_REG = 0xFF;
}
static void sfx_jump(void)   { NR10_REG=0x16; NR11_REG=0x80; NR12_REG=0x91; NR13_REG=0x40; NR14_REG=0x86; }
static void sfx_boom(void)   { NR10_REG=0x1C; NR11_REG=0x40; NR12_REG=0x81; NR13_REG=0xC0; NR14_REG=0x86; }
static void sfx_treat(void)  { NR10_REG=0x24; NR11_REG=0x80; NR12_REG=0xB2; NR13_REG=0x20; NR14_REG=0x87; }
static void sfx_hit(void)    { NR41_REG=0x14; NR42_REG=0xA1; NR43_REG=0x42; NR44_REG=0xC0; }
static void sfx_hurt(void)   { NR10_REG=0x4C; NR11_REG=0x80; NR12_REG=0xC3; NR13_REG=0x80; NR14_REG=0x85; }
static void sfx_roar(void)   { NR41_REG=0x28; NR42_REG=0xC3; NR43_REG=0x65; NR44_REG=0xC0; }

static void bgm_tick(void) {
    if (!bgm_on || game_state != STATE_PLAYING) return;
    if (bgm_timer > 0) { bgm_timer--; return; }
    bgm_timer = 9;
    uint16_t f = BGM_NOTES[bgm_step];
    bgm_step = (uint8_t)((bgm_step + 1) & 31);
    if (f) {
        NR21_REG = 0x40;
        NR22_REG = 0x42;
        NR23_REG = (uint8_t)(f & 0xFF);
        NR24_REG = (uint8_t)(0x80 | ((f >> 8) & 0x07));
    }
}

/* =========================================================================
 * VRAM / TILEMAP / FONT HELPERS
 * ========================================================================= */
static void put_bg(uint8_t tx, uint8_t ty, uint8_t tile, uint8_t pal) {
    tx &= 31;
    if (is_cgb) {
        VBK_REG = 1;
        set_bkg_tile_xy(tx, ty, pal & 0x07);
        VBK_REG = 0;
    }
    set_bkg_tile_xy(tx, ty, tile);
}

static void put_win(uint8_t tx, uint8_t ty, uint8_t tile, uint8_t pal) {
    if (is_cgb) {
        VBK_REG = 1;
        set_win_tile_xy(tx, ty, pal & 0x07);
        VBK_REG = 0;
    }
    set_win_tile_xy(tx, ty, tile);
}

static uint8_t ch_tile(char c) {
    if (c >= '0' && c <= '9') return (uint8_t)(TILE_DIGIT_0 + (c - '0'));
    if (c >= 'A' && c <= 'Z') return (uint8_t)(TILE_LETTER_A + (c - 'A'));
    if (c == ':') return TILE_COLON;
    if (c == '-') return TILE_DASH;
    if (c == '!') return TILE_BANG;
    return BG_HUD_BLANK;
}

static void win_text(uint8_t x, uint8_t y, const char *s, uint8_t pal) {
    while (*s) put_win(x++, y, ch_tile(*s++), pal);
}

static void bg_text(uint8_t x, uint8_t y, const char *s, uint8_t pal) {
    while (*s) put_bg(x++, y, ch_tile(*s++), pal);
}

static void win_num(uint8_t x, uint8_t y, uint16_t v, uint8_t d, uint8_t pal) {
    while (d > 0) {
        d--;
        put_win((uint8_t)(x + d), y, (uint8_t)(TILE_DIGIT_0 + (uint8_t)(v % 10)), pal);
        v /= 10;
    }
}

static void load_font_1bpp(uint8_t start, const uint8_t (*glyphs)[8], uint8_t count) {
    /* Foreground = color 0 (white in HUD pal 3), Background = color 3 (dark in HUD pal 3) */
    uint8_t buf[16];
    for (uint8_t g = 0; g < count; g++) {
        for (uint8_t r = 0; r < 8; r++) {
            uint8_t inv = (uint8_t)(~glyphs[g][r]);
            buf[r * 2]     = inv;
            buf[r * 2 + 1] = inv;
        }
        set_bkg_data((uint8_t)(start + g), 1, buf);
    }
}

static void hide_all_sprites(void) {
    for (uint8_t i = 0; i < 40; i++) move_sprite(i, 0, 0);
}

static void set_spr(uint8_t id, int16_t sx, int16_t sy, uint8_t tile, uint8_t pal, uint8_t flipx) {
    if (sx < -8 || sx > 168 || sy < -8 || sy > 128) {
        move_sprite(id, 0, 0);
        return;
    }
    set_sprite_tile(id, tile);
    set_sprite_prop(id, (uint8_t)((pal & 0x07) | (flipx ? S_FLIPX : 0)));
    move_sprite(id, (uint8_t)(sx + 8), (uint8_t)(sy + 16));
}

static void draw_metasprite_2x2(uint8_t base_id, int16_t sx, int16_t sy,
                                uint8_t tl, uint8_t tr, uint8_t bl, uint8_t br,
                                uint8_t pal_top, uint8_t pal_bot, uint8_t flipx) {
    if (!flipx) {
        set_spr(base_id + 0, sx,     sy,     tl, pal_top, 0);
        set_spr(base_id + 1, sx + 8, sy,     tr, pal_top, 0);
        set_spr(base_id + 2, sx,     sy + 8, bl, pal_bot, 0);
        set_spr(base_id + 3, sx + 8, sy + 8, br, pal_bot, 0);
    } else {
        set_spr(base_id + 0, sx,     sy,     tr, pal_top, 1);
        set_spr(base_id + 1, sx + 8, sy,     tl, pal_top, 1);
        set_spr(base_id + 2, sx,     sy + 8, br, pal_bot, 1);
        set_spr(base_id + 3, sx + 8, sy + 8, bl, pal_bot, 1);
    }
}

static void graphics_init(void) {
    DISPLAY_OFF;
    is_cgb = (_cpu == CGB_TYPE) ? 1 : 0;

    set_bkg_data(0, BG_TILE_COUNT, BG_TILE_DATA);
    load_font_1bpp(TILE_DIGIT_0,  FONT_DIGITS,  10);
    load_font_1bpp(TILE_LETTER_A, FONT_LETTERS, 26);
    load_font_1bpp(TILE_COLON,    FONT_PUNCT,   3);
    set_sprite_data(0, SPR_TILE_COUNT, SPR_TILE_DATA);

    if (is_cgb) {
        set_bkg_palette(0, 5, STAGE_BG_PALS[0]);
        set_sprite_palette(0, 8, SPR_PALS);
    } else {
        BGP_REG  = 0xE4;
        OBP0_REG = 0xE4;
        OBP1_REG = 0xE4;
    }

    SPRITES_8x8;
    SHOW_BKG;
    SHOW_SPRITES;
    HIDE_WIN;
    DISPLAY_ON;
}

/* =========================================================================
 * LEVEL COLUMN STREAMER & HUD
 * ========================================================================= */
static void draw_level_column(uint8_t col) {
    uint8_t vcol = (uint8_t)(col & 31);
    for (uint8_t r = 0; r < 14; r++) {
        put_bg(vcol, r, BG_SKY, 0);
    }
    /* Clouds */
    if ((col & 7) == 2) {
        put_bg(vcol, 2, BG_CLOUD_L, 0);
    } else if ((col & 7) == 3) {
        put_bg(vcol, 2, BG_CLOUD_R, 0);
    }
    /* Scenery bushes */
    if ((col % 9) == 4 && col < 44) {
        put_bg(vcol, 13, BG_BUSH, 1);
    }
    /* Ground rows 14 & 15 */
    put_bg(vcol, 14, BG_GRASS_TOP, 1);
    put_bg(vcol, 15, BG_DIRT, 1);

    /* Platforms */
    int16_t wx = (int16_t)col * 8;
    for (uint8_t i = 0; i < plat_cnt; i++) {
        if (wx >= plats[i].x && wx < plats[i].x + (int16_t)plats[i].w) {
            put_bg(vcol, (uint8_t)(plats[i].y >> 3), BG_BRICK, 2);
        }
    }
    /* ? Blocks */
    for (uint8_t i = 0; i < qblock_cnt; i++) {
        if (wx == qblocks[i].x) {
            put_bg(vcol, (uint8_t)(qblocks[i].y >> 3), qblocks[i].used ? BG_QUSED : BG_QBLOCK, 2);
        }
    }
}

static void update_hud(void) {
    /* Row 0: 5 Hearts + Stage + Score */
    for (uint8_t i = 0; i < 5; i++) {
        put_win(i, 0, (i < php) ? BG_HEART_FULL : BG_HEART_EMPTY, 4);
    }
    put_win(5, 0, BG_HUD_BLANK, 3);
    win_text(6, 0, "STG", 3);
    put_win(9, 0, (uint8_t)(TILE_DIGIT_0 + stage_idx + 1), 3);
    put_win(10, 0, BG_HUD_BLANK, 3);
    win_num(15, 0, score, 5, 3);

    /* Row 1: Chairman + Boss HP bar if active */
    for (uint8_t x = 0; x < 20; x++) put_win(x, 1, BG_HUD_BLANK, 3);
    if (boss.active && boss.hp > 0) {
        if (boss.type == 0)      win_text(0, 1, "LION:", 3);
        else if (boss.type == 1) win_text(0, 1, "TIGER:", 3);
        else                     win_text(0, 1, "ELEPH:", 3);

        uint8_t bars = (uint8_t)(((uint16_t)boss.hp * 10u + boss.max_hp - 1) / boss.max_hp);
        for (uint8_t i = 0; i < 10; i++) {
            put_win((uint8_t)(7 + i), 1, (i < bars) ? BG_BAR_FULL : BG_BAR_EMPTY, 4);
        }
    } else {
        win_text(0, 1, "CHAIRMAN", 3);
        win_text(10, 1, "B:BONE A:J", 3);
    }
}

/* =========================================================================
 * STAGE SETUP
 * ========================================================================= */
static void set_plat(uint8_t i, int16_t x, int8_t y, uint8_t w) {
    plats[i].x = x; plats[i].y = y; plats[i].w = w;
}
static void set_qblock(uint8_t i, int16_t x, int8_t y) {
    qblocks[i].x = x; qblocks[i].y = y; qblocks[i].used = 0;
}
static void set_treat_float(uint8_t i, int16_t x, int8_t y) {
    treats[i].active = 1; treats[i].x = x; treats[i].y = y;
    treats[i].vy = 0; treats[i].floating = 1; treats[i].base_y = y;
}
static void set_enemy(uint8_t i, uint8_t type, int16_t x, int8_t y, int16_t minx, int16_t maxx, uint8_t hp, uint8_t hop) {
    enemies[i].active = 1; enemies[i].type = type; enemies[i].x = x; enemies[i].y = y;
    enemies[i].vx = -1; enemies[i].vy = 0; enemies[i].min_x = minx; enemies[i].max_x = maxx;
    enemies[i].hp = hp; enemies[i].hop_timer = hop;
}

static void load_stage(uint8_t idx, uint8_t keep_hp) {
    stage_idx = idx;
    DISPLAY_OFF;
    hide_all_sprites();

    if (is_cgb) {
        set_bkg_palette(0, 5, STAGE_BG_PALS[stage_idx]);
    }

    cam_x = 0;
    boss_locked = 0;
    SCX_REG = 0;
    SCY_REG = 0;

    px = 24;
    py_fp = (int16_t)(GROUND_Y - 16) << 4;
    pvy_fp = 0;
    pfacing = 1;
    pjumps = 2;
    php = keep_hp ? (php < 3 ? 3 : php) : 5;
    pinvul = 0;
    pthrow_cd = 0;

    /* Clear dynamic arrays */
    for (uint8_t i = 0; i < MAX_BOOMS; i++) booms[i].active = 0;
    for (uint8_t i = 0; i < MAX_PROJS; i++) projs[i].active = 0;
    for (uint8_t i = 0; i < MAX_TREATS; i++) treats[i].active = 0;
    for (uint8_t i = 0; i < MAX_ENEMIES; i++) enemies[i].active = 0;

    /* Platforms & ? Blocks */
    plat_cnt = 6;
    set_plat(0, 72,  80, 32);
    set_plat(1, 152, 72, 32);
    set_plat(2, 224, 80, 32);
    set_plat(3, 288, 64, 32);
    /* 2 Boss Arena Dodge Platforms */
    set_plat(4, 376, 80, 24);
    set_plat(5, 448, 72, 24);

    qblock_cnt = 4;
    set_qblock(0, 80,  48);
    set_qblock(1, 168, 40);
    set_qblock(2, 240, 48);
    set_qblock(3, 384, 48);

    /* Floating Treats */
    set_treat_float(0, 120, 64);
    set_treat_float(1, 296, 48);

    /* Enemies: Mice (0) and Cats (1) */
    uint8_t cat_hp = (uint8_t)(1 + (stage_idx > 0 ? 1 : 0));
    set_enemy(0, 0, 112, GROUND_Y - 8,   72, 168, 1,      60);
    set_enemy(1, 1, 192, GROUND_Y - 16, 144, 240, cat_hp, 45);
    set_enemy(2, 0, 264, GROUND_Y - 8,  216, 320, 1,      60);
    set_enemy(3, 1, 316, GROUND_Y - 16, 256, 344, cat_hp, 35);

    /* Stage Boss */
    boss.active = 0;
    boss.type = stage_idx;
    boss.x = 468;
    boss.y = GROUND_Y - 16;
    boss.vx = 0;
    boss.vy = 0;
    boss.facing = -1;
    boss.max_hp = (stage_idx == 0) ? 8 : (stage_idx == 1) ? 10 : 14;
    boss.hp = boss.max_hp;
    boss.state = 0;
    boss.timer = 50;
    boss.hurt_flash = 0;
    boss.treat_cd = 260;

    /* Draw initial 24 tile columns */
    for (uint8_t c = 0; c < 24; c++) draw_level_column(c);
    last_streamed_col = 23;

    /* Setup bottom Window HUD */
    for (uint8_t y = 0; y < 2; y++)
        for (uint8_t x = 0; x < 20; x++)
            put_win(x, y, BG_HUD_BLANK, 3);
    move_win(7, 128);
    SHOW_WIN;
    update_hud();

    game_state = STATE_PLAYING;
    DISPLAY_ON;
}

/* =========================================================================
 * TITLE & STATUS SCREENS
 * ========================================================================= */
static void draw_title_screen(void) {
    DISPLAY_OFF;
    HIDE_WIN;
    hide_all_sprites();
    SCX_REG = 0;
    SCY_REG = 0;
    if (is_cgb) set_bkg_palette(0, 5, STAGE_BG_PALS[0]);

    for (uint8_t y = 0; y < 18; y++)
        for (uint8_t x = 0; x < 20; x++)
            put_bg(x, y, BG_HUD_BLANK, 3);

    bg_text(2, 2,  "CHAIRMAN", 3);
    bg_text(2, 3,  "ADVENTURE!", 3);
    bg_text(2, 5,  "MODRETRO GBC", 4);

    bg_text(2, 8,  "STG 1: LION",     (stage_idx == 0) ? 4 : 3);
    bg_text(2, 9,  "STG 2: TIGER",    (stage_idx == 1) ? 4 : 3);
    bg_text(2, 10, "STG 3: ELEPHANT", (stage_idx == 2) ? 4 : 3);

    bg_text(2, 13, "A:JUMP  B:BONE", 3);
    bg_text(2, 14, "EAT TREAT: +HP", 3);
    bg_text(3, 16, "PRESS START!", 4);

    /* Show Chairman sprite posing on title screen! */
    draw_metasprite_2x2(0, 124, 24, SPR_DOG_TL, SPR_DOG_TR, SPR_DOG_BL_1, SPR_DOG_BR_1, 0, 1, 0);
    set_spr(4, 144, 26, SPR_BONE_1, 0, 0);

    DISPLAY_ON;
}

static void draw_banner_screen(const char *l1, const char *l2, const char *l3) {
    DISPLAY_OFF;
    HIDE_WIN;
    hide_all_sprites();
    SCX_REG = 0;
    SCY_REG = 0;
    for (uint8_t y = 0; y < 18; y++)
        for (uint8_t x = 0; x < 20; x++)
            put_bg(x, y, BG_HUD_BLANK, 3);

    bg_text(3, 5,  l1, 4);
    bg_text(2, 8,  l2, 3);
    bg_text(3, 12, l3, 3);
    draw_metasprite_2x2(0, 72, 16, SPR_DOG_TL, SPR_DOG_TR, SPR_DOG_BL_1, SPR_DOG_BR_1, 0, 1, 0);
    DISPLAY_ON;
}

/* =========================================================================
 * GAMEPLAY LOGIC
 * ========================================================================= */
static uint8_t box_hit(int16_t ax, int8_t ay, uint8_t aw, uint8_t ah,
                       int16_t bx, int8_t by, uint8_t bw, uint8_t bh) {
    return (ax < bx + (int16_t)bw && ax + (int16_t)aw > bx &&
            ay < by + (int8_t)bh && ay + (int8_t)ah > by);
}

static void spawn_treat(int16_t tx, int8_t ty) {
    for (uint8_t i = 0; i < MAX_TREATS; i++) {
        if (!treats[i].active) {
            treats[i].active = 1;
            treats[i].x = tx;
            treats[i].y = ty;
            treats[i].vy = -3;
            treats[i].floating = 0;
            treats[i].base_y = ty;
            return;
        }
    }
}

static void spawn_proj(int16_t x, int8_t y, int8_t vx, int8_t vy, uint8_t grav) {
    for (uint8_t i = 0; i < MAX_PROJS; i++) {
        if (!projs[i].active) {
            projs[i].active = 1;
            projs[i].x = x;
            projs[i].y = y;
            projs[i].vx = vx;
            projs[i].vy = vy;
            projs[i].gravity = grav;
            projs[i].life = 110;
            return;
        }
    }
}

static void hurt_player(void) {
    if (pinvul > 0) return;
    if (php > 0) php--;
    pinvul = 65;
    pvy_fp = -36;
    sfx_hurt();
    update_hud();
    if (php == 0) {
        game_state = STATE_GAMEOVER;
        draw_banner_screen("GAME OVER!", "TRY AGAIN!", "PRESS START");
    }
}

static void damage_boss(void) {
    if (!boss.active || boss.hp == 0) return;
    boss.hp--;
    boss.hurt_flash = 10;
    score += 50;
    sfx_hit();
    update_hud();
    if (boss.hp == 0) {
        boss.active = 0;
        score += 500;
        sfx_treat();
        if (stage_idx < 2) {
            game_state = STATE_STAGECLEAR;
            draw_banner_screen("BOSS DEFEATED!", "GOOD BOY CHAIRMAN!", "START: NEXT STG");
        } else {
            game_state = STATE_VICTORY;
            draw_banner_screen("VICTORY!!", "CHAIRMAN IS HERO!", "START: PLAY AGAIN");
        }
    }
}

static void throw_boomerang(void) {
    if (pthrow_cd > 0) return;
    for (uint8_t i = 0; i < MAX_BOOMS; i++) {
        if (!booms[i].active) {
            booms[i].active = 1;
            booms[i].x = px + (pfacing > 0 ? 12 : -4);
            booms[i].y = (int8_t)((py_fp >> 4) + 4);
            booms[i].dir = pfacing;
            booms[i].vx = (int8_t)(pfacing * 4);
            booms[i].age = 0;
            booms[i].returning = 0;
            booms[i].hit_cd = 0;
            pthrow_cd = 16;
            sfx_boom();
            return;
        }
    }
}

static void update_playing(uint8_t joy, uint8_t pressed) {
    frame_cnt++;
    bgm_tick();

    if (pressed & J_START) {
        game_state = STATE_PAUSED;
        win_text(10, 1, "PAUSED    ", 4);
        return;
    }

    if (pinvul > 0) pinvul--;
    if (pthrow_cd > 0) pthrow_cd--;

    /* Horizontal movement */
    int8_t move_x = 0;
    if (joy & J_LEFT)  { move_x = -2; pfacing = -1; pwalk_cnt++; }
    if (joy & J_RIGHT) { move_x =  2; pfacing =  1; pwalk_cnt++; }

    px += move_x;
    int16_t min_x = boss_locked ? (ARENA_CAM_X + 2) : 2;
    if (px < min_x) px = min_x;
    if (px > LEVEL_PX - 18) px = LEVEL_PX - 18;

    /* Jump (Double Jump!) */
    if ((pressed & J_A) && pjumps > 0) {
        pvy_fp = (pjumps == 2) ? -58 : -50;
        pjumps--;
        sfx_jump();
    }

    /* Throw Bone Boomerang */
    if (pressed & J_B) {
        throw_boomerang();
    }

    /* Gravity & Vertical Collisions */
    int8_t prev_y = (int8_t)(py_fp >> 4);
    pvy_fp += 4;
    if (pvy_fp > 64) pvy_fp = 64;
    py_fp += pvy_fp;
    int8_t py = (int8_t)(py_fp >> 4);

    if (py + 16 >= GROUND_Y) {
        py = GROUND_Y - 16;
        py_fp = (int16_t)py << 4;
        pvy_fp = 0;
        pjumps = 2;
    }

    /* One-way Brick Platforms */
    for (uint8_t i = 0; i < plat_cnt; i++) {
        if (pvy_fp >= 0 && prev_y + 16 <= plats[i].y + 4 && py + 16 >= plats[i].y &&
            px + 13 > plats[i].x && px + 3 < plats[i].x + (int16_t)plats[i].w) {
            py = plats[i].y - 16;
            py_fp = (int16_t)py << 4;
            pvy_fp = 0;
            pjumps = 2;
        }
    }

    /* ? Blocks (bump from below to pop out Treat!) */
    for (uint8_t i = 0; i < qblock_cnt; i++) {
        if (box_hit(px + 2, py, 12, 16, qblocks[i].x, qblocks[i].y, 8, 8)) {
            if (pvy_fp < 0 && prev_y >= qblocks[i].y + 4) {
                py = (int8_t)(qblocks[i].y + 8);
                py_fp = (int16_t)py << 4;
                pvy_fp = 8;
                if (!qblocks[i].used) {
                    qblocks[i].used = 1;
                    put_bg((uint8_t)(qblocks[i].x >> 3), (uint8_t)(qblocks[i].y >> 3), BG_QUSED, 2);
                    spawn_treat(qblocks[i].x, (int8_t)(qblocks[i].y - 8));
                    sfx_treat();
                }
            }
        }
    }

    /* Camera scroll & Column streaming */
    if (!boss_locked) {
        int16_t target_cam = px - 56;
        if (target_cam < 0) target_cam = 0;
        if (target_cam > ARENA_CAM_X) target_cam = ARENA_CAM_X;
        if (target_cam > cam_x) cam_x = target_cam;

        uint8_t needed_col = (uint8_t)((cam_x >> 3) + 22);
        if (needed_col >= LEVEL_TILES) needed_col = LEVEL_TILES - 1;
        while (last_streamed_col < needed_col) {
            last_streamed_col++;
            draw_level_column(last_streamed_col);
        }

        if (cam_x >= ARENA_CAM_X && px >= ARENA_CAM_X + 16) {
            boss_locked = 1;
            boss.active = 1;
            sfx_roar();
            update_hud();
        }
    }
    SCX_REG = (uint8_t)(cam_x & 0xFF);

    /* Update Bone Boomerangs */
    for (uint8_t i = 0; i < MAX_BOOMS; i++) {
        if (!booms[i].active) continue;
        booms[i].age++;
        if (booms[i].hit_cd > 0) booms[i].hit_cd--;

        if (!booms[i].returning) {
            booms[i].x += booms[i].vx;
            if (booms[i].age >= 22) booms[i].returning = 1;
        } else {
            int16_t tx = px + 4;
            int8_t  ty = (int8_t)(py + 4);
            if (booms[i].x < tx) booms[i].x += 4; else if (booms[i].x > tx) booms[i].x -= 4;
            if (booms[i].y < ty) booms[i].y += 2; else if (booms[i].y > ty) booms[i].y -= 2;
            if ((booms[i].x >= px - 4 && booms[i].x <= px + 16 && booms[i].y >= py - 4 && booms[i].y <= py + 16) || booms[i].age > 75) {
                booms[i].active = 0;
                continue;
            }
        }

        /* Hit Enemies */
        for (uint8_t j = 0; j < MAX_ENEMIES; j++) {
            if (!enemies[j].active) continue;
            uint8_t ew = (enemies[j].type == 1) ? 16 : 8;
            uint8_t eh = (enemies[j].type == 1) ? 16 : 8;
            if (booms[i].hit_cd == 0 && box_hit(booms[i].x, booms[i].y, 8, 8, enemies[j].x, enemies[j].y, ew, eh)) {
                booms[i].hit_cd = 8;
                enemies[j].hp--;
                sfx_hit();
                if (enemies[j].hp == 0) {
                    enemies[j].active = 0;
                    score += (enemies[j].type == 1) ? 100 : 50;
                    if (php < 5) spawn_treat(enemies[j].x, enemies[j].y);
                    update_hud();
                }
            }
        }

        /* Hit Boss */
        if (boss.active && booms[i].hit_cd == 0 && box_hit(booms[i].x, booms[i].y, 8, 8, boss.x, boss.y, 16, 16)) {
            booms[i].hit_cd = 12;
            damage_boss();
        }
    }

    /* Update Treats */
    for (uint8_t i = 0; i < MAX_TREATS; i++) {
        if (!treats[i].active) continue;
        if (treats[i].floating) {
            treats[i].y = (int8_t)(treats[i].base_y + (((frame_cnt >> 3) & 1) ? 1 : -1));
        } else {
            if (frame_cnt & 1) {
                if (treats[i].vy < 3) treats[i].vy++;
                treats[i].y += treats[i].vy;
                if (treats[i].y + 8 >= GROUND_Y) {
                    treats[i].y = GROUND_Y - 8;
                    treats[i].vy = 0;
                }
            }
        }
        if (box_hit(px, py, 16, 16, treats[i].x, treats[i].y, 8, 8)) {
            treats[i].active = 0;
            if (php < 5) php++;
            score += 75;
            sfx_treat();
            update_hud();
        }
    }

    /* Update Enemies (Mice & Cats) */
    for (uint8_t i = 0; i < MAX_ENEMIES; i++) {
        if (!enemies[i].active) continue;
        if (frame_cnt & 1) {
            enemies[i].x += enemies[i].vx;
            if (enemies[i].x <= enemies[i].min_x) enemies[i].vx = 1;
            if (enemies[i].x >= enemies[i].max_x) enemies[i].vx = -1;
        }
        uint8_t ew = (enemies[i].type == 1) ? 16 : 8;
        uint8_t eh = (enemies[i].type == 1) ? 16 : 8;

        if (enemies[i].type == 1) {
            /* Cats hop! */
            if (enemies[i].hop_timer > 0) enemies[i].hop_timer--;
            else if (enemies[i].y + 16 >= GROUND_Y) {
                enemies[i].vy = -4;
                enemies[i].hop_timer = 70;
            }
            if ((frame_cnt & 3) == 0 && enemies[i].vy < 4) enemies[i].vy++;
            enemies[i].y += enemies[i].vy;
            if (enemies[i].y + 16 >= GROUND_Y) { enemies[i].y = GROUND_Y - 16; enemies[i].vy = 0; }
        }

        if (box_hit(px + 2, py + 2, 12, 14, enemies[i].x, enemies[i].y, ew, eh)) {
            if (pvy_fp > 0 && prev_y + 14 <= enemies[i].y + 6) {
                pvy_fp = -46;
                pjumps = 1;
                enemies[i].hp--;
                sfx_hit();
                if (enemies[i].hp == 0) {
                    enemies[i].active = 0;
                    score += (enemies[i].type == 1) ? 100 : 50;
                    update_hud();
                }
            } else {
                hurt_player();
            }
        }
    }

    /* Update Boss */
    if (boss.active && boss.hp > 0) {
        if (boss.hurt_flash > 0) boss.hurt_flash--;
        boss.facing = (px < boss.x) ? -1 : 1;

        /* Drop healing treat during long boss fight */
        if (boss.treat_cd > 0) boss.treat_cd--;
        else {
            boss.treat_cd = 280;
            if (php <= 3) spawn_treat(ARENA_CAM_X + 64, 24);
        }

        if (boss.timer > 0) boss.timer--;
        if (boss.state == 0) {
            boss.vx = 0;
            if (boss.timer == 0) {
                if (boss.type == 0) {
                    /* LION: Roar wave or Charge */
                    if (frame_cnt & 1) {
                        boss.state = 1; boss.timer = 40; sfx_roar();
                        spawn_proj(boss.x + (boss.facing < 0 ? -6 : 16), GROUND_Y - 10, (int8_t)(boss.facing * 2), 0, 0);
                    } else {
                        boss.state = 2; boss.timer = 44; boss.vx = (int8_t)(boss.facing * 2);
                    }
                } else if (boss.type == 1) {
                    /* TIGER: Leap or Fast Slash */
                    if (frame_cnt & 1) {
                        boss.state = 2; boss.timer = 46; boss.vy = -5; boss.vx = (int8_t)(boss.facing * 2); sfx_jump();
                    } else {
                        boss.state = 1; boss.timer = 36; sfx_roar();
                        spawn_proj(boss.x + (boss.facing < 0 ? -6 : 16), GROUND_Y - 14, (int8_t)(boss.facing * 3), 0, 0);
                    }
                } else {
                    /* ELEPHANT: Earthquake Stomp or Boulder Toss */
                    if (frame_cnt & 1) {
                        boss.state = 3; boss.timer = 55; boss.vy = -4; boss.vx = boss.facing;
                    } else {
                        boss.state = 1; boss.timer = 44; sfx_roar();
                        spawn_proj(boss.x + (boss.facing < 0 ? -6 : 16), boss.y, (int8_t)(boss.facing * 2), -4, 1);
                    }
                }
            }
        } else if (boss.timer == 0) {
            boss.state = 0;
            boss.timer = (boss.type == 1) ? 34 : 46;
        }

        uint8_t was_air = (boss.y + 16 < GROUND_Y);
        boss.x += boss.vx;
        if ((frame_cnt & 3) == 0 && boss.vy < 4) boss.vy++;
        boss.y += boss.vy;
        if (boss.y + 16 >= GROUND_Y) {
            boss.y = GROUND_Y - 16;
            boss.vy = 0;
            if (was_air && boss.type == 2 && boss.state == 3) {
                sfx_roar();
                spawn_proj(boss.x, GROUND_Y - 8, -2, 0, 0);
                spawn_proj(boss.x + 12, GROUND_Y - 8, 2, 0, 0);
            }
        }
        if (boss.x < ARENA_CAM_X + 8) boss.x = ARENA_CAM_X + 8;
        if (boss.x > LEVEL_PX - 22) boss.x = LEVEL_PX - 22;

        if (box_hit(px + 2, py + 2, 12, 14, boss.x, boss.y, 16, 16)) {
            if (pvy_fp > 0 && prev_y + 14 <= boss.y + 6) {
                pvy_fp = -50;
                pjumps = 1;
                damage_boss();
            } else {
                hurt_player();
            }
        }
    }

    /* Update Boss Projectiles */
    for (uint8_t i = 0; i < MAX_PROJS; i++) {
        if (!projs[i].active) continue;
        projs[i].x += projs[i].vx;
        projs[i].y += projs[i].vy;
        if (projs[i].gravity && (frame_cnt & 3) == 0 && projs[i].vy < 4) projs[i].vy++;
        if (projs[i].y + 8 >= GROUND_Y) {
            projs[i].y = GROUND_Y - 8;
            projs[i].vy = projs[i].gravity ? -2 : 0;
        }
        if (box_hit(px + 2, py + 2, 12, 14, projs[i].x, projs[i].y, 8, 8)) {
            projs[i].active = 0;
            hurt_player();
            continue;
        }
        if (projs[i].life == 0 || projs[i].x < ARENA_CAM_X - 16 || projs[i].x > LEVEL_PX + 16) {
            projs[i].active = 0;
        } else {
            projs[i].life--;
        }
    }

    /* =====================================================================
     * RENDER ALL HARDWARE SPRITES (OAM 0..29)
     * ===================================================================== */
    /* 0..3: Chairman (2x2 with 2 distinct CGB palettes!) */
    if (pinvul > 0 && (pinvul & 4)) {
        for (uint8_t i = 0; i < 4; i++) move_sprite(i, 0, 0);
    } else {
        uint8_t step = (uint8_t)((pwalk_cnt >> 3) & 1);
        draw_metasprite_2x2(
            0, px - cam_x, py,
            SPR_DOG_TL, SPR_DOG_TR,
            step ? SPR_DOG_BL_2 : SPR_DOG_BL_1,
            step ? SPR_DOG_BR_2 : SPR_DOG_BR_1,
            0, 1, (pfacing < 0) ? 1 : 0
        );
    }

    /* 4..5: Bone Boomerangs */
    for (uint8_t i = 0; i < MAX_BOOMS; i++) {
        if (booms[i].active) {
            set_spr((uint8_t)(4 + i), booms[i].x - cam_x, booms[i].y,
                    ((frame_cnt >> 2) & 1) ? SPR_BONE_2 : SPR_BONE_1, 0, 0);
        } else {
            move_sprite((uint8_t)(4 + i), 0, 0);
        }
    }

    /* 6..9: Treats */
    for (uint8_t i = 0; i < 4; i++) {
        if (i < MAX_TREATS && treats[i].active) {
            set_spr((uint8_t)(6 + i), treats[i].x - cam_x, treats[i].y, SPR_TREAT, 2, 0);
        } else {
            move_sprite((uint8_t)(6 + i), 0, 0);
        }
    }

    /* 10..21: Enemies (up to 3 slots x 4 sprites each, Mice use 1 sprite) */
    uint8_t slot = 10;
    for (uint8_t i = 0; i < MAX_ENEMIES && slot <= 18; i++) {
        if (!enemies[i].active) continue;
        int16_t sx = enemies[i].x - cam_x;
        if (sx < -16 || sx > 168) continue;
        if (enemies[i].type == 0) {
            set_spr(slot, sx, enemies[i].y, SPR_MOUSE, 3, (enemies[i].vx > 0) ? 1 : 0);
            move_sprite((uint8_t)(slot + 1), 0, 0);
            move_sprite((uint8_t)(slot + 2), 0, 0);
            move_sprite((uint8_t)(slot + 3), 0, 0);
        } else {
            draw_metasprite_2x2(slot, sx, enemies[i].y,
                                SPR_CAT_TL, SPR_CAT_TR, SPR_CAT_BL, SPR_CAT_BR,
                                4, 4, (enemies[i].vx > 0) ? 1 : 0);
        }
        slot += 4;
    }
    while (slot < 22) { move_sprite(slot++, 0, 0); }

    /* 22..25: Boss */
    if (boss.active && boss.hp > 0 && ((boss.hurt_flash & 2) == 0)) {
        uint8_t tl = (boss.type == 0) ? SPR_LION_TL : (boss.type == 1) ? SPR_TIGER_TL : SPR_ELE_TL;
        uint8_t pal = (boss.type == 0) ? 4 : (boss.type == 1) ? 5 : 6;
        draw_metasprite_2x2(22, boss.x - cam_x, boss.y,
                            tl, (uint8_t)(tl + 1), (uint8_t)(tl + 2), (uint8_t)(tl + 3),
                            pal, pal, (boss.facing > 0) ? 1 : 0);
    } else {
        for (uint8_t i = 22; i < 26; i++) move_sprite(i, 0, 0);
    }

    /* 26..29: Boss Projectiles */
    for (uint8_t i = 0; i < MAX_PROJS; i++) {
        if (projs[i].active) {
            set_spr((uint8_t)(26 + i), projs[i].x - cam_x, projs[i].y, SPR_PROJ, 7, 0);
        } else {
            move_sprite((uint8_t)(26 + i), 0, 0);
        }
    }
}

/* =========================================================================
 * MAIN LOOP
 * ========================================================================= */
void main(void) {
    sound_init();
    graphics_init();
    draw_title_screen();

    while (1) {
        vsync();
        uint8_t joy = joypad();
        uint8_t pressed = (uint8_t)(joy & (uint8_t)(~prev_joy));

        if (game_state == STATE_TITLE) {
            if (pressed & (J_SELECT | J_DOWN)) {
                stage_idx = (uint8_t)((stage_idx + 1) % 3);
                sfx_jump();
                draw_title_screen();
            } else if (pressed & J_UP) {
                stage_idx = (uint8_t)((stage_idx + 2) % 3);
                sfx_jump();
                draw_title_screen();
            } else if (pressed & (J_START | J_A)) {
                score = 0;
                sfx_treat();
                load_stage(stage_idx, 0);
            }
        } else if (game_state == STATE_PLAYING) {
            update_playing(joy, pressed);
        } else if (game_state == STATE_PAUSED) {
            if (pressed & J_START) {
                game_state = STATE_PLAYING;
                update_hud();
            } else if (pressed & J_SELECT) {
                bgm_on = (uint8_t)(!bgm_on);
                sfx_jump();
            }
        } else if (game_state == STATE_STAGECLEAR) {
            if (pressed & (J_START | J_A)) {
                load_stage((uint8_t)(stage_idx + 1), 1);
            }
        } else if (game_state == STATE_GAMEOVER) {
            if (pressed & (J_START | J_A)) {
                load_stage(stage_idx, 0);
            }
        } else if (game_state == STATE_VICTORY) {
            if (pressed & (J_START | J_A)) {
                stage_idx = 0;
                score = 0;
                draw_title_screen();
                game_state = STATE_TITLE;
            }
        }

        prev_joy = joy;
    }
}
