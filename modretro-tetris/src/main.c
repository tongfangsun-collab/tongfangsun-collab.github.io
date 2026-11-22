/*
 * MODRETRO TETRIS — Native Game Boy Color (.gbc) Cartridge ROM
 * Compatible with ModRetro Chromatic, Game Boy Color (CGB), and Game Boy (DMG)
 *
 * Controls (ModRetro Chromatic / GBC):
 *   D-Pad Left / Right : Move piece (with DAS)
 *   D-Pad Down         : Soft drop (+1 pt/cell)
 *   D-Pad Up           : Hard drop (+2 pts/cell)
 *   A Button           : Rotate Clockwise
 *   B Button           : Rotate Counter-Clockwise
 *   SELECT             : Hold / Swap Piece (or toggle music when paused)
 *   START              : Start / Pause / Restart
 */

#include <gb/gb.h>
#include <gb/cgb.h>
#include <stdint.h>
#include <stdbool.h>
#include "tiles.h"

/* Playfield dimensions (10x17 visible well inside 20x18 GBC tilemap) */
#define BOARD_W      10
#define BOARD_H      17
#define WELL_X       1
#define WELL_Y       0

/* Game states */
#define STATE_TITLE    0
#define STATE_PLAYING  1
#define STATE_PAUSED   2
#define STATE_GAMEOVER 3

/* 8 Hardware Game Boy Color Background Palettes (4 colors each, RGB555)
 * Order: [0: bg dark, 1: shadow, 2: main color, 3: highlight]
 */
static const palette_color_t CGB_BG_PALETTES[8 * 4] = {
    /* 0: UI Chrome & Ghost */
    RGB(2, 3, 5),   RGB(9, 11, 15), RGB(20, 23, 27), RGB(31, 31, 31),
    /* 1: I-Piece (Cyan) */
    RGB(2, 3, 5),   RGB(0, 15, 20), RGB(0, 28, 31),  RGB(22, 31, 31),
    /* 2: O-Piece (Gold Yellow) */
    RGB(2, 3, 5),   RGB(20, 14, 0), RGB(31, 26, 2),  RGB(31, 31, 20),
    /* 3: T-Piece (Electric Purple) */
    RGB(2, 3, 5),   RGB(13, 4, 20), RGB(25, 10, 31), RGB(30, 23, 31),
    /* 4: S-Piece (Emerald Green) */
    RGB(2, 3, 5),   RGB(3, 15, 7),  RGB(4, 29, 14),  RGB(22, 31, 25),
    /* 5: Z-Piece (Crimson Red) */
    RGB(2, 3, 5),   RGB(18, 3, 5),  RGB(31, 7, 11),  RGB(31, 22, 24),
    /* 6: J-Piece (Cobalt Blue) */
    RGB(2, 3, 5),   RGB(3, 9, 20),  RGB(7, 17, 31),  RGB(22, 26, 31),
    /* 7: L-Piece (ModRetro Orange) */
    RGB(2, 3, 5),   RGB(20, 8, 0),  RGB(31, 16, 2),  RGB(31, 26, 19)
};

/*
 * 7 Tetrominoes x 4 Rotations x 4 Minos x (dx, dy)
 * Piece indices: 0=I, 1=O, 2=T, 3=S, 4=Z, 5=J, 6=L
 * Palette index = piece_index + 1 (maps cleanly to CGB palettes 1..7)
 */
static const int8_t SHAPES[7][4][4][2] = {
    /* 0: I */
    {
        {{0,1},{1,1},{2,1},{3,1}},
        {{2,0},{2,1},{2,2},{2,3}},
        {{0,2},{1,2},{2,2},{3,2}},
        {{1,0},{1,1},{1,2},{1,3}}
    },
    /* 1: O */
    {
        {{1,0},{2,0},{1,1},{2,1}},
        {{1,0},{2,0},{1,1},{2,1}},
        {{1,0},{2,0},{1,1},{2,1}},
        {{1,0},{2,0},{1,1},{2,1}}
    },
    /* 2: T */
    {
        {{1,0},{0,1},{1,1},{2,1}},
        {{1,0},{1,1},{2,1},{1,2}},
        {{0,1},{1,1},{2,1},{1,2}},
        {{1,0},{0,1},{1,1},{1,2}}
    },
    /* 3: S */
    {
        {{1,0},{2,0},{0,1},{1,1}},
        {{1,0},{1,1},{2,1},{2,2}},
        {{1,1},{2,1},{0,2},{1,2}},
        {{0,0},{0,1},{1,1},{1,2}}
    },
    /* 4: Z */
    {
        {{0,0},{1,0},{1,1},{2,1}},
        {{2,0},{1,1},{2,1},{1,2}},
        {{0,1},{1,1},{1,2},{2,2}},
        {{1,0},{0,1},{1,1},{0,2}}
    },
    /* 5: J */
    {
        {{0,0},{0,1},{1,1},{2,1}},
        {{1,0},{2,0},{1,1},{1,2}},
        {{0,1},{1,1},{2,1},{2,2}},
        {{1,0},{1,1},{0,2},{1,2}}
    },
    /* 6: L */
    {
        {{2,0},{0,1},{1,1},{2,1}},
        {{1,0},{1,1},{1,2},{2,2}},
        {{0,1},{1,1},{2,1},{0,2}},
        {{0,0},{1,0},{1,1},{1,2}}
    }
};

/* Gravity delay (frames per drop) by level 1..15 */
static const uint8_t GRAVITY_TABLE[15] = {
    44, 38, 33, 28, 24, 20, 16, 13, 10, 8, 7, 6, 5, 4, 3
};

/* Wall kick offsets for rotation */
static const int8_t KICKS[6][2] = {
    {0, 0}, {-1, 0}, {1, 0}, {-2, 0}, {2, 0}, {0, -1}
};

/* Original retro chiptune melody (GB frequency register values, 0 = rest) */
static const uint16_t BGM_NOTES[32] = {
    1546, 0, 1379, 1452, 1546, 0, 1452, 1379,
    1297, 0, 1297, 1452, 1650, 0, 1546, 1452,
    1379, 0, 1452, 1546, 1650, 0, 1546, 0,
    1452, 0, 1297, 0, 1297, 0, 0, 0
};

/* Game state globals */
static uint8_t board[BOARD_H][BOARD_W]; /* 0 = empty, 1..7 = locked piece palette */
static uint8_t game_state = STATE_TITLE;
static uint8_t cur_piece, cur_rot;
static int8_t  cur_x, cur_y;
static uint8_t next_piece;
static uint8_t hold_piece;
static uint8_t hold_used;
static uint8_t bag[7];
static uint8_t bag_idx;

static uint32_t score = 0;
static uint32_t hi_score = 0;
static uint16_t lines = 0;
static uint8_t  level = 1;

static uint16_t rng_state = 0xACE1u;
static uint8_t  prev_joy = 0;
static uint8_t  das_dir = 0;
static uint8_t  das_timer = 0;
static uint8_t  grav_timer = 0;
static uint8_t  soft_timer = 0;
static uint8_t  bgm_enabled = 1;
static uint8_t  bgm_step = 0;
static uint8_t  bgm_timer = 0;
static uint8_t  is_cgb = 0;

/* Fast 16-bit Galois LFSR PRNG */
static uint8_t rand_byte(void) {
    uint16_t lsb = rng_state & 1u;
    rng_state >>= 1;
    if (lsb) rng_state ^= 0xB400u;
    return (uint8_t)(rng_state & 0xFFu);
}

/* =========================================================================
 * HARDWARE AUDIO (GB/GBC APU)
 * ========================================================================= */
static void sound_init(void) {
    NR52_REG = 0x80; /* Power on APU */
    NR50_REG = 0x77; /* Max L/R volume */
    NR51_REG = 0xFF; /* Route all channels to L/R */
}

static void sfx_move(void) {
    NR10_REG = 0x00;
    NR11_REG = 0x80;
    NR12_REG = 0x61;
    NR13_REG = 0x40;
    NR14_REG = 0x86;
}

static void sfx_rotate(void) {
    NR10_REG = 0x16;
    NR11_REG = 0x80;
    NR12_REG = 0x81;
    NR13_REG = 0x80;
    NR14_REG = 0x86;
}

static void sfx_lock(void) {
    NR41_REG = 0x18;
    NR42_REG = 0x91;
    NR43_REG = 0x52;
    NR44_REG = 0xC0;
}

static void sfx_clear(uint8_t count) {
    NR10_REG = (count >= 4) ? 0x24 : 0x14;
    NR11_REG = 0x80;
    NR12_REG = 0xC2;
    NR13_REG = (count >= 4) ? 0x20 : 0xA0;
    NR14_REG = (count >= 4) ? 0x87 : 0x86;
    NR41_REG = 0x20;
    NR42_REG = 0xA2;
    NR43_REG = 0x31;
    NR44_REG = 0xC0;
}

static void sfx_gameover(void) {
    NR10_REG = 0x4C;
    NR11_REG = 0x80;
    NR12_REG = 0xD4;
    NR13_REG = 0x80;
    NR14_REG = 0x85;
}

static void bgm_tick(void) {
    if (!bgm_enabled || game_state != STATE_PLAYING) return;
    if (bgm_timer > 0) {
        bgm_timer--;
        return;
    }
    uint8_t tempo = (level > 8) ? 7 : (uint8_t)(12 - (level >> 1));
    bgm_timer = tempo;
    uint16_t freq = BGM_NOTES[bgm_step];
    bgm_step = (uint8_t)((bgm_step + 1) & 31);
    if (freq > 0) {
        NR21_REG = 0x40; /* 25% duty */
        NR22_REG = 0x42; /* Gentle volume + fade */
        NR23_REG = (uint8_t)(freq & 0xFFu);
        NR24_REG = (uint8_t)(0x80u | ((freq >> 8) & 0x07u));
    }
}

/* =========================================================================
 * VRAM TILE & ATTRIBUTE HELPERS (CGB + DMG SAFE)
 * ========================================================================= */
static void put_tile(uint8_t x, uint8_t y, uint8_t tile, uint8_t pal) {
    if (is_cgb) {
        VBK_REG = 1;
        set_bkg_tile_xy(x, y, pal & 0x07u);
        VBK_REG = 0;
    }
    set_bkg_tile_xy(x, y, tile);
}

static uint8_t char_to_tile(char c) {
    if (c >= '0' && c <= '9') return (uint8_t)(TILE_DIGIT_0 + (c - '0'));
    if (c >= 'A' && c <= 'Z') return (uint8_t)(TILE_LETTER_A + (c - 'A'));
    if (c == ':') return TILE_COLON;
    if (c == '-') return TILE_DASH;
    if (c == '!') return TILE_BANG;
    if (c == '.') return TILE_DOT;
    return TILE_BLANK;
}

static void draw_text(uint8_t x, uint8_t y, const char *s, uint8_t pal) {
    while (*s) {
        put_tile(x++, y, char_to_tile(*s++), pal);
    }
}

static void draw_num(uint8_t x, uint8_t y, uint32_t val, uint8_t digits, uint8_t pal) {
    uint8_t i = digits;
    while (i > 0) {
        i--;
        put_tile((uint8_t)(x + i), y, (uint8_t)(TILE_DIGIT_0 + (uint8_t)(val % 10u)), pal);
        val /= 10u;
    }
}

static void load_font_1bpp(uint8_t start_tile, const uint8_t (*glyphs)[8], uint8_t count) {
    uint8_t buf[16];
    for (uint8_t g = 0; g < count; g++) {
        for (uint8_t r = 0; r < 8; r++) {
            uint8_t row = glyphs[g][r];
            buf[r * 2]     = row; /* color 3: both bitplanes set */
            buf[r * 2 + 1] = row;
        }
        set_bkg_data((uint8_t)(start_tile + g), 1, buf);
    }
}

static void graphics_init(void) {
    DISPLAY_OFF;
    is_cgb = (_cpu == CGB_TYPE) ? 1 : 0;

    set_bkg_data(0, 14, BASE_TILES);
    load_font_1bpp(TILE_DIGIT_0,  FONT_1BPP_DIGITS,  10);
    load_font_1bpp(TILE_LETTER_A, FONT_1BPP_LETTERS, 26);
    load_font_1bpp(TILE_COLON,    FONT_1BPP_PUNCT,    4);

    if (is_cgb) {
        set_bkg_palette(0, 8, CGB_BG_PALETTES);
    } else {
        /* DMG fallback palette: 0=black bg, 1=dark gray, 2=light gray, 3=white */
        BGP_REG = 0x1Bu;
    }

    SHOW_BKG;
    DISPLAY_ON;
}

static void clear_screen(uint8_t tile, uint8_t pal) {
    for (uint8_t y = 0; y < 18; y++) {
        for (uint8_t x = 0; x < 20; x++) {
            put_tile(x, y, tile, pal);
        }
    }
}

static void draw_box(uint8_t x, uint8_t y, uint8_t w, uint8_t h) {
    put_tile(x, y, TILE_BOX_TL, 0);
    put_tile((uint8_t)(x + w - 1), y, TILE_BOX_TR, 0);
    put_tile(x, (uint8_t)(y + h - 1), TILE_BOX_BL, 0);
    put_tile((uint8_t)(x + w - 1), (uint8_t)(y + h - 1), TILE_BOX_BR, 0);
    for (uint8_t i = 1; i < w - 1; i++) {
        put_tile((uint8_t)(x + i), y, TILE_BOX_T, 0);
        put_tile((uint8_t)(x + i), (uint8_t)(y + h - 1), TILE_BOX_T, 0);
    }
    for (uint8_t j = 1; j < h - 1; j++) {
        put_tile(x, (uint8_t)(y + j), TILE_BOX_L, 0);
        put_tile((uint8_t)(x + w - 1), (uint8_t)(y + j), TILE_BOX_R, 0);
        for (uint8_t i = 1; i < w - 1; i++) {
            put_tile((uint8_t)(x + i), (uint8_t)(y + j), TILE_BLANK, 0);
        }
    }
}

/* =========================================================================
 * TETRIS CORE LOGIC
 * ========================================================================= */
static void refill_bag(void) {
    for (uint8_t i = 0; i < 7; i++) bag[i] = i;
    for (uint8_t i = 6; i > 0; i--) {
        uint8_t j = (uint8_t)(rand_byte() % (uint8_t)(i + 1));
        uint8_t tmp = bag[i];
        bag[i] = bag[j];
        bag[j] = tmp;
    }
    bag_idx = 0;
}

static uint8_t pop_bag(void) {
    if (bag_idx >= 7) refill_bag();
    return bag[bag_idx++];
}

static uint8_t collides(uint8_t piece, uint8_t rot, int8_t px, int8_t py) {
    for (uint8_t i = 0; i < 4; i++) {
        int8_t nx = (int8_t)(px + SHAPES[piece][rot][i][0]);
        int8_t ny = (int8_t)(py + SHAPES[piece][rot][i][1]);
        if (nx < 0 || nx >= BOARD_W || ny >= BOARD_H) return 1;
        if (ny >= 0 && board[ny][nx] != 0) return 1;
    }
    return 0;
}

static int8_t compute_ghost_y(void) {
    int8_t gy = cur_y;
    while (!collides(cur_piece, cur_rot, cur_x, (int8_t)(gy + 1))) {
        gy++;
    }
    return gy;
}

/* =========================================================================
 * RENDERERS
 * ========================================================================= */
static void draw_mini_piece(uint8_t piece, uint8_t bx, uint8_t by) {
    for (uint8_t r = 0; r < 2; r++) {
        for (uint8_t c = 0; c < 4; c++) {
            put_tile((uint8_t)(bx + c), (uint8_t)(by + r), TILE_BLANK, 0);
        }
    }
    if (piece >= 7) return;
    uint8_t pal = (uint8_t)(piece + 1);
    for (uint8_t i = 0; i < 4; i++) {
        uint8_t dx = (uint8_t)SHAPES[piece][0][i][0];
        uint8_t dy = (uint8_t)SHAPES[piece][0][i][1];
        /* Shift I-piece up by 1 row in 4x2 preview box */
        if (piece == 0 && dy > 0) dy = 0;
        if (dy < 2) {
            put_tile((uint8_t)(bx + dx), (uint8_t)(by + dy), TILE_BLOCK, pal);
        }
    }
}

static void draw_hud_stats(void) {
    draw_num(13, 2, score, 6, 0);
    draw_num(17, 4, level, 2, 7);
    draw_num(16, 5, lines, 3, 1);
}

static void draw_well_full(void) {
    for (uint8_t y = 0; y < BOARD_H; y++) {
        for (uint8_t x = 0; x < BOARD_W; x++) {
            uint8_t cell = board[y][x];
            if (cell) {
                put_tile((uint8_t)(WELL_X + x), (uint8_t)(WELL_Y + y), TILE_BLOCK, cell);
            } else {
                put_tile((uint8_t)(WELL_X + x), (uint8_t)(WELL_Y + y), TILE_WELL_BG, 0);
            }
        }
    }
}

static void draw_active_and_ghost(uint8_t show) {
    int8_t gy = compute_ghost_y();
    uint8_t pal = (uint8_t)(cur_piece + 1);

    /* Ghost piece */
    if (gy != cur_y) {
        for (uint8_t i = 0; i < 4; i++) {
            int8_t gx = (int8_t)(cur_x + SHAPES[cur_piece][cur_rot][i][0]);
            int8_t cy = (int8_t)(gy + SHAPES[cur_piece][cur_rot][i][1]);
            if (cy >= 0 && cy < BOARD_H && gx >= 0 && gx < BOARD_W && board[cy][gx] == 0) {
                put_tile((uint8_t)(WELL_X + gx), (uint8_t)(WELL_Y + cy),
                         show ? TILE_GHOST : TILE_WELL_BG, show ? pal : 0);
            }
        }
    }

    /* Active falling piece */
    for (uint8_t i = 0; i < 4; i++) {
        int8_t ax = (int8_t)(cur_x + SHAPES[cur_piece][cur_rot][i][0]);
        int8_t ay = (int8_t)(cur_y + SHAPES[cur_piece][cur_rot][i][1]);
        if (ay >= 0 && ay < BOARD_H && ax >= 0 && ax < BOARD_W) {
            put_tile((uint8_t)(WELL_X + ax), (uint8_t)(WELL_Y + ay),
                     show ? TILE_BLOCK : TILE_WELL_BG, show ? pal : 0);
        }
    }
}

static void draw_title_screen(void) {
    DISPLAY_OFF;
    clear_screen(TILE_BLANK, 0);

    /* Top rainbow tetromino bar */
    for (uint8_t x = 1; x < 19; x++) {
        uint8_t pal = (uint8_t)(((x - 1) % 7) + 1);
        put_tile(x, 1, TILE_BLOCK, pal);
        put_tile(x, 16, TILE_BLOCK, pal);
    }

    /* Center title card */
    draw_box(2, 3, 16, 6);
    draw_text(6, 4, "MODRETRO", 7);
    draw_text(5, 5, "T E T R I S", 1);
    draw_text(5, 7, "CHROMATIC!", 2);

    /* Decorative mini pieces */
    draw_mini_piece(0, 3, 10);
    draw_mini_piece(2, 8, 10);
    draw_mini_piece(4, 13, 10);

    draw_text(4, 13, "PRESS START!", 3);
    draw_text(2, 14, "UP:DROP SEL:HOLD", 0);

    if (hi_score > 0) {
        draw_text(3, 15, "BEST:", 0);
        draw_num(9, 15, hi_score, 6, 2);
    }

    DISPLAY_ON;
}

static void draw_play_chrome(void) {
    DISPLAY_OFF;
    clear_screen(TILE_BLANK, 0);

    /* Walls & floor */
    for (uint8_t y = 0; y < BOARD_H; y++) {
        put_tile(0, y, TILE_WALL, 0);
        put_tile(11, y, TILE_WALL, 0);
    }
    for (uint8_t x = 0; x <= 11; x++) {
        put_tile(x, 17, TILE_FLOOR, 0);
    }

    /* Right HUD Sidebar (cols 12..19) */
    draw_text(13, 1, "SCORE", 0);
    draw_text(13, 4, "LV", 0);
    draw_text(13, 5, "LN", 0);

    draw_text(13, 7, "NEXT", 1);
    draw_box(13, 8, 6, 4);

    draw_text(13, 12, "HOLD", 7);
    draw_box(13, 13, 6, 4);

    draw_text(12, 17, "MODRETRO", 7);

    draw_well_full();
    draw_hud_stats();
    draw_mini_piece(next_piece, 14, 9);
    draw_mini_piece(hold_piece, 14, 14);
    draw_active_and_ghost(1);

    DISPLAY_ON;
}

static void draw_pause_overlay(void) {
    vsync();
    draw_box(2, 6, 8, 5);
    draw_text(3, 7, "PAUSED", 2);
    draw_text(3, 9, "START!", 0);
}

static void draw_gameover_overlay(void) {
    vsync();
    draw_box(2, 5, 8, 7);
    draw_text(4, 6, "GAME", 5);
    draw_text(4, 7, "OVER", 5);
    draw_text(3, 9, "START:", 0);
    draw_text(3, 10, "RETRY!", 2);
}

/* =========================================================================
 * GAMEPLAY ACTIONS
 * ========================================================================= */
static void spawn_piece(uint8_t p) {
    cur_piece = p;
    cur_rot = 0;
    cur_x = 3;
    cur_y = 0;
    grav_timer = 0;

    if (collides(cur_piece, cur_rot, cur_x, cur_y)) {
        game_state = STATE_GAMEOVER;
        if (score > hi_score) hi_score = score;
        sfx_gameover();
        draw_gameover_overlay();
    }
}

static void start_new_game(void) {
    /* Seed PRNG with hardware divider + timer for true ModRetro randomness */
    rng_state ^= ((uint16_t)DIV_REG << 8) | (uint16_t)(DIV_REG ^ 0x5Au);
    if (rng_state == 0) rng_state = 0xACE1u;

    for (uint8_t y = 0; y < BOARD_H; y++) {
        for (uint8_t x = 0; x < BOARD_W; x++) {
            board[y][x] = 0;
        }
    }

    score = 0;
    lines = 0;
    level = 1;
    hold_piece = 255;
    hold_used = 0;
    das_dir = 0;
    das_timer = 0;
    grav_timer = 0;
    bgm_step = 0;
    bgm_timer = 0;

    refill_bag();
    uint8_t first = pop_bag();
    next_piece = pop_bag();
    game_state = STATE_PLAYING;

    cur_piece = first;
    cur_rot = 0;
    cur_x = 3;
    cur_y = 0;

    draw_play_chrome();
}

static void clear_full_lines(void) {
    uint8_t full_rows[4];
    uint8_t count = 0;

    for (uint8_t y = 0; y < BOARD_H; y++) {
        uint8_t full = 1;
        for (uint8_t x = 0; x < BOARD_W; x++) {
            if (board[y][x] == 0) {
                full = 0;
                break;
            }
        }
        if (full && count < 4) {
            full_rows[count++] = y;
        }
    }

    if (count == 0) return;

    sfx_clear(count);

    /* Crisp 12-frame flash animation across cleared rows */
    for (uint8_t f = 0; f < 4; f++) {
        vsync();
        uint8_t tile = (f & 1) ? TILE_WELL_BG : TILE_FLASH;
        for (uint8_t k = 0; k < count; k++) {
            uint8_t ry = full_rows[k];
            for (uint8_t x = 0; x < BOARD_W; x++) {
                put_tile((uint8_t)(WELL_X + x), (uint8_t)(WELL_Y + ry), tile, 0);
            }
        }
        vsync();
        vsync();
    }

    /* Collapse rows downward */
    for (uint8_t k = 0; k < count; k++) {
        uint8_t ry = full_rows[k];
        for (int8_t y = (int8_t)ry; y > 0; y--) {
            for (uint8_t x = 0; x < BOARD_W; x++) {
                board[y][x] = board[y - 1][x];
            }
        }
        for (uint8_t x = 0; x < BOARD_W; x++) {
            board[0][x] = 0;
        }
    }

    /* Score & level update */
    static const uint16_t LINE_PTS[5] = {0, 100, 300, 500, 800};
    score += (uint32_t)LINE_PTS[count] * (uint32_t)level;
    if (score > 999999u) score = 999999u;
    if (score > hi_score) hi_score = score;

    lines += count;
    uint8_t new_level = (uint8_t)((lines / 10u) + 1u);
    if (new_level > 15) new_level = 15;
    level = new_level;

    vsync();
    draw_well_full();
    draw_hud_stats();
}

static void lock_current_piece(void) {
    uint8_t pal = (uint8_t)(cur_piece + 1);
    for (uint8_t i = 0; i < 4; i++) {
        int8_t ax = (int8_t)(cur_x + SHAPES[cur_piece][cur_rot][i][0]);
        int8_t ay = (int8_t)(cur_y + SHAPES[cur_piece][cur_rot][i][1]);
        if (ay >= 0 && ay < BOARD_H && ax >= 0 && ax < BOARD_W) {
            board[ay][ax] = pal;
        }
    }
    sfx_lock();
    hold_used = 0;
    clear_full_lines();

    uint8_t upcoming = next_piece;
    next_piece = pop_bag();
    spawn_piece(upcoming);

    if (game_state == STATE_PLAYING) {
        vsync();
        draw_mini_piece(next_piece, 14, 9);
        draw_hud_stats();
        draw_active_and_ghost(1);
    }
}

static void try_rotate(int8_t dir) {
    uint8_t new_rot = (uint8_t)((cur_rot + (dir > 0 ? 1 : 3)) & 3u);
    for (uint8_t k = 0; k < 6; k++) {
        int8_t tx = (int8_t)(cur_x + KICKS[k][0]);
        int8_t ty = (int8_t)(cur_y + KICKS[k][1]);
        if (!collides(cur_piece, new_rot, tx, ty)) {
            vsync();
            draw_active_and_ghost(0);
            cur_rot = new_rot;
            cur_x = tx;
            cur_y = ty;
            draw_active_and_ghost(1);
            sfx_rotate();
            return;
        }
    }
}

static void do_hold(void) {
    if (hold_used) return;
    hold_used = 1;
    vsync();
    draw_active_and_ghost(0);

    if (hold_piece >= 7) {
        hold_piece = cur_piece;
        uint8_t upcoming = next_piece;
        next_piece = pop_bag();
        cur_piece = upcoming;
    } else {
        uint8_t swap = hold_piece;
        hold_piece = cur_piece;
        cur_piece = swap;
    }
    cur_rot = 0;
    cur_x = 3;
    cur_y = 0;
    grav_timer = 0;

    draw_mini_piece(next_piece, 14, 9);
    draw_mini_piece(hold_piece, 14, 14);
    draw_active_and_ghost(1);
    sfx_rotate();
}

static void do_hard_drop(void) {
    int8_t gy = compute_ghost_y();
    uint8_t dist = (uint8_t)(gy - cur_y);
    vsync();
    draw_active_and_ghost(0);
    cur_y = gy;
    draw_active_and_ghost(1);
    score += (uint32_t)dist * 2u;
    if (score > 999999u) score = 999999u;
    lock_current_piece();
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
            rng_state = (uint16_t)(rng_state + 1u + DIV_REG);
            if (pressed & (J_START | J_A)) {
                sfx_rotate();
                start_new_game();
            }
        } else if (game_state == STATE_PAUSED) {
            if (pressed & J_START) {
                game_state = STATE_PLAYING;
                vsync();
                draw_well_full();
                draw_active_and_ghost(1);
            } else if (pressed & J_SELECT) {
                bgm_enabled = (uint8_t)(!bgm_enabled);
                sfx_move();
            }
        } else if (game_state == STATE_GAMEOVER) {
            if (pressed & (J_START | J_A)) {
                start_new_game();
            }
        } else if (game_state == STATE_PLAYING) {
            bgm_tick();

            /* Pause */
            if (pressed & J_START) {
                game_state = STATE_PAUSED;
                draw_pause_overlay();
                prev_joy = joy;
                continue;
            }

            /* Hold piece */
            if (pressed & J_SELECT) {
                do_hold();
            }

            /* Rotation */
            if (pressed & J_A) {
                try_rotate(1);
            } else if (pressed & J_B) {
                try_rotate(-1);
            }

            /* Hard Drop (Up) */
            if (pressed & J_UP) {
                do_hard_drop();
                prev_joy = joy;
                continue;
            }

            /* Horizontal Movement + DAS */
            int8_t move_dx = 0;
            if (pressed & J_LEFT) {
                move_dx = -1;
                das_dir = J_LEFT;
                das_timer = 11;
            } else if (pressed & J_RIGHT) {
                move_dx = 1;
                das_dir = J_RIGHT;
                das_timer = 11;
            } else if (das_dir && (joy & das_dir)) {
                if (das_timer > 0) {
                    das_timer--;
                } else {
                    move_dx = (das_dir == J_LEFT) ? -1 : 1;
                    das_timer = 3;
                }
            } else {
                das_dir = 0;
            }

            if (move_dx != 0 && !collides(cur_piece, cur_rot, (int8_t)(cur_x + move_dx), cur_y)) {
                draw_active_and_ghost(0);
                cur_x = (int8_t)(cur_x + move_dx);
                draw_active_and_ghost(1);
                sfx_move();
            }

            /* Soft drop & Gravity */
            uint8_t drop_now = 0;
            uint8_t soft = 0;
            if (joy & J_DOWN) {
                if (soft_timer == 0) {
                    drop_now = 1;
                    soft = 1;
                    soft_timer = 2;
                } else {
                    soft_timer--;
                }
            } else {
                soft_timer = 0;
            }

            grav_timer++;
            uint8_t grav_limit = GRAVITY_TABLE[(level > 15) ? 14 : (uint8_t)(level - 1)];
            if (grav_timer >= grav_limit) {
                grav_timer = 0;
                drop_now = 1;
            }

            if (drop_now) {
                if (!collides(cur_piece, cur_rot, cur_x, (int8_t)(cur_y + 1))) {
                    draw_active_and_ghost(0);
                    cur_y++;
                    draw_active_and_ghost(1);
                    if (soft) {
                        score++;
                        if (score > 999999u) score = 999999u;
                        draw_hud_stats();
                    }
                } else {
                    lock_current_piece();
                }
            }
        }

        prev_joy = joy;
    }
}
