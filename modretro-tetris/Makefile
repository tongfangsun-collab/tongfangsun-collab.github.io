GBDK_HOME ?= /home/antigravity/tools/gbdk
LCC       := $(GBDK_HOME)/bin/lcc

# -Wm-yc : CGB + DMG dual-compatible cartridge (full color on ModRetro Chromatic / GBC, works on DMG)
# -Wm-yt0: ROM-only 32KB cartridge (maximum flashcart & hardware compatibility)
# -Wm-yn : Cartridge internal ROM header title
LCCFLAGS  := -Wm-yc -Wm-yt0 -Wm-yn"MODRETROTET"

TARGET    := rom/modretro-tetris.gbc
SRC       := src/main.c

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SRC) src/tiles.h
	mkdir -p rom
	$(LCC) $(LCCFLAGS) -o $(TARGET) $(SRC)

clean:
	rm -f rom/*.gbc rom/*.ihx rom/*.map rom/*.noi rom/*.sym
