/**
 * Sydney Opera House — 8-Layer Architectural Deconstruction Data
 * Based on Jørn Utzon's 1962 "Yellow Book", Ove Arup & Partners structural engineering archives,
 * and the Chinese Architectural Exploded Axonometric Blueprint.
 */

const ARCHITECTURE_DATA = {
  project: {
    title: "Sydney Opera House",
    subtitle: "Interactive 3D Architectural Deconstruction",
    architect: "Jørn Utzon (Denmark)",
    structuralEngineers: "Ove Arup & Partners (Sir Ove Arup, Jack Zunz, Michael Lewis)",
    interiorArchitect: "Peter Hall (Stage III completion, 1966–1973)",
    location: "Bennelong Point, Sydney Harbour, NSW, Australia",
    constructionPeriod: "1959 – 1973 (Opened Oct 20, 1973 by Queen Elizabeth II)",
    unescoWorldHeritage: "Inscribed in 2007 as a masterpiece of human creative genius",
    siteArea: "1.8 hectares (4.4 acres)",
    totalLength: "183 metres (600 ft)",
    maxWidth: "120 metres (394 ft)",
    highestPoint: "67 metres (220 ft) above sea level (~22-storey building)",
    estimatedTotalWeight: "161,000 tonnes",
    foundationPiers: "588 concrete piers sunk up to 25 metres (82 ft) into sea bed",
    ceramicTilesCount: "1,056,006 tiles (Höganäs, Sweden)"
  },

  layers: [
    {
      id: 8,
      key: "shells",
      title: "Precast Spherical Shell Roofs",
      subTitleZh: "贝壳形屋顶 (The Sails)",
      category: "Roof Vault System",
      elevation: "+67m Summit",
      stage: "Stage II (1963–1967)",
      leadSummary: "The world-famous 'sails' are monumental precast concrete shell vaults formed from segments cut from a single imaginary sphere of 75-metre radius.",
      concept: "For four years after winning the 1957 competition, Utzon and Ove Arup struggled to find a buildable mathematical geometry for the free-form billowing shells. In 1961, Utzon had a flash of insight often likened to peeling segments from an orange: every shell could be carved from the surface of one single sphere (radius ~75m). This 'Spherical Solution' turned an impossible sculptural form into a modular system of precast concrete rib segments manufactured with reusable formwork.",
      engineering: "The shell vaults act as thin-shell compression membranes. Each sail consists of symmetrical arched halves meeting along a central ridge beam. The precast arch segments were erected using an adjustable steel arch erection truss (the 'Kangaroo' crane / Hornibrook arch rig), bonded with epoxy resin, and post-tensioned with internal steel tendon cables.",
      materials: [
        "1,056,006 Swedish Höganäs ceramic tiles (120mm square) with crushed stone aggregate",
        "Dual glaze finish: 4,228 chevron-shaped prefabricated tile lids combining gloss off-white and matte cream",
        "High-strength precast concrete segments bonded with epoxy resin and post-tensioned steel tendons",
        "Cast-bronze crown cap pieces and ridge gutters"
      ],
      loadTransmission: "Wind and gravitational dead loads travel down the spherical shells in membrane compression, transferring forces into the concrete rib arches below.",
      image: "assets/layer_08_shells.jpg",
      diagram: "assets/diagram_shell_assembly.jpg",
      cameraTarget: { x: 0, y: 7.5, z: 0, distance: 16 }
    },

    {
      id: 7,
      key: "ribs",
      title: "Fan Radial Concrete Rib Arches",
      subTitleZh: "肋骨结构 (Radial Ribs)",
      category: "Primary Structural Frame",
      elevation: "+15m to +60m",
      stage: "Stage II (1963–1967)",
      leadSummary: "Massive fan-shaped precast concrete rib arches radiating upward from paired foundation pedestals, forming the load-bearing spine for the roof shells.",
      concept: "To avoid solid shell walls and allow expansive, column-free interior volumes, Arup and Utzon devised a ribbed structural vault. Concrete ribs fan outward from heavy cast-in-place pedestals at the podium level, curving up to meet along the ridge beams. The hollow Y-shaped and T-shaped precast rib segments were cast on site in a dedicated casting yard on Bennelong Point.",
      engineering: "Each rib arch functions as a three-pinned or two-pinned segmental arch subjected primarily to axial compression and bending moments under asymmetric wind loads. High-tensile steel prestressing cables thread through internal ducts in the rib blocks, pulled taut to lock the segments into rigid structural arches capable of spanning up to 50 metres without central supports.",
      materials: [
        "Precast concrete rib blocks (2,194 segments cast on Bennelong Point)",
        "Post-tensioned high-tensile steel cable tendons (Freyssinet system)",
        "Structural epoxy adhesive jointing compounds",
        "Heavy reinforced cast-in-place concrete foundation thrust blocks"
      ],
      loadTransmission: "Collects compressive thrust from the roof shells and channels combined gravity and wind loads down into the massive concrete podium pedestals.",
      image: "assets/layer_07_ribs.jpg",
      diagram: "assets/diagram_rib_structure.jpg",
      cameraTarget: { x: 0, y: 5.5, z: 0, distance: 15 }
    },

    {
      id: 6,
      key: "stage",
      title: "Performance Stages & Fly Tower Machinery",
      subTitleZh: "舞台空间 (Stages & Fly Towers)",
      category: "Performance Machinery & Backstage",
      elevation: "+4m to +25m",
      stage: "Stage III (1967–1973)",
      leadSummary: "State-of-the-art dual theatrical stage boxes, automated fly towers, scenery elevators, and acoustic stage shells tailored for opera, ballet, and symphony.",
      concept: "The Opera House houses two primary performance halls side-by-side: the Concert Hall (Major Hall, 2,679 seats) and the Joan Sutherland Theatre (Minor Hall, 1,507 seats). Because Utzon's shell roofs eliminated traditional vertical fly towers seen in conventional European opera houses, the stage machinery had to be engineered with extreme vertical compactness, placing vast scenery elevators and double-level stages beneath the podium floor.",
      engineering: "Features motorized counterweight fly systems, overhead lighting bridges, adjustable acoustic cloud reflectors, proscenium stage portals, and sub-stage hydraulic stage lifts that raise sets directly from underground storage docks. Acoustic stage enclosures can be deployed or retracted to adapt the reverberation time between orchestral symphonies (~2.0s) and operatic drama (~1.4s).",
      materials: [
        "Structural steel truss stage fly grids and catwalks",
        "Acoustic composite timber sound reflectors and proscenium frames",
        "Heavy-duty hydraulic and screw-jack stage lifts",
        "Flame-retardant stage curtains and sound-dampening acoustic drapes"
      ],
      loadTransmission: "Stage and theatrical equipment loads are suspended from overhead structural trusses and anchored into deep reinforced concrete basement retention walls.",
      image: "assets/layer_06_stage.jpg",
      diagram: "assets/diagram_load_paths.jpg",
      cameraTarget: { x: 0, y: 3.5, z: 0, distance: 14 }
    },

    {
      id: 5,
      key: "auditorium",
      title: "Concert Hall & Opera Auditoriums",
      subTitleZh: "观众席 (Auditorium & Seating)",
      category: "Acoustic Halls & Seating Tiers",
      elevation: "+6m to +22m",
      stage: "Stage III (1967–1973)",
      leadSummary: "Steeply raked continental seating tiers crafted from Australian brush box and white birch plywood, engineered for acoustic intimacy and sightlines.",
      concept: "Utzon's original competition vision was to liberate the audience from the rigid social class divisions of traditional horseshoe opera boxes. The seating tiers follow an expansive, continuous fan plan that rises steeply from the orchestra floor, ensuring every seat has an uninterrupted direct sightline to the performers and immersive acoustic reflection.",
      engineering: "Acoustic design by Jordan & Arup (completed by Peter Hall with Lothar Cremer and Wilhelm Jordan). Birch plywood acoustic reflectors hang from the concrete ceiling ribs, deflecting direct sound waves into the rear seating balconies. The Concert Hall features the Grand Organ (10,154 pipes, world's largest mechanical tracker-action pipe organ). A landmark 2020–2022 renewal by ARM Architecture further enhanced acoustic balance with automated petal reflectors.",
      materials: [
        "Australian Brush Box (Lophostemon confertus) solid timber flooring and wall paneling",
        "White Birch plywood acoustic ceiling reflectors and faceted wall boxes",
        "Custom woven wool upholstery in vibrant magenta, plum, and red hues",
        "Cast-iron seat brackets with internal acoustic air conditioning diffusers"
      ],
      loadTransmission: "Seating tier slabs rest on inclined concrete raker beams supported by podium columns, transferring audience live loads directly into the podium foundation.",
      image: "assets/layer_05_auditorium.jpg",
      diagram: "assets/diagram_internal_section.jpg",
      cameraTarget: { x: 0, y: 2.2, z: 0, distance: 13 }
    },

    {
      id: 4,
      key: "foyer",
      title: "Grand Foyers & Public Concourse Spine",
      subTitleZh: "剧院大厅 (Grand Foyers)",
      category: "Circulation & Public Architecture",
      elevation: "+4m to +14m",
      stage: "Stage I & III (1959–1973)",
      leadSummary: "A continuous pedestrian spine and soaring public promenades wrapped along the harbour edge, framing 180-degree panoramic water vistas.",
      concept: "Utzon conceived the Opera House not as an isolated cultural fortress, but as a grand public promenade where moving through the building is an event in itself. Visitors transition from the open southern plaza through the monumental ticketing halls, progressing upward into dramatic northern foyers suspended directly over the water.",
      engineering: "The public foyers feature expansive column-free spans achieved via folded concrete ceiling plates and cantilevered concrete promenade walkways. Sweeping spiral and straight staircases link the lower box office levels with upper cocktail lounges and outdoor viewing terraces facing Sydney Harbour Bridge and Fort Denison.",
      materials: [
        "Reconstituted pink granite terrazzo pavers matching the outdoor podium",
        "Exposed off-form architectural board-marked concrete walls",
        "Solid Australian brass handrails and bronze door furniture",
        "Custom wool tapestry murals designed by Jørn Utzon and John Coburn ('Curtain of the Sun' and 'Curtain of the Moon')"
      ],
      loadTransmission: "Wide-span folded concrete floor slabs carry dynamic pedestrian crowd loads, supported on interior core pylons and foundation caissons.",
      image: "assets/layer_04_foyer.jpg",
      diagram: "assets/diagram_internal_section.jpg",
      cameraTarget: { x: 0, y: 1.0, z: 0, distance: 13 }
    },

    {
      id: 3,
      key: "glass",
      title: "Bronze-Tinted Structural Glass Curtain Walls",
      subTitleZh: "玻璃幕墙 (Glass Curtain Walls)",
      category: "Exterior Envelope & Glazing",
      elevation: "+2m to +30m",
      stage: "Stage III (1967–1973)",
      leadSummary: "Soaring faceted glass facades closing the open mouths of the concrete shell vaults, designed with custom laminated bronze glass hung from plywood and steel mullions.",
      concept: "Following Utzon's departure in 1966, Australian architect Peter Hall tackled the immense challenge of glazing the open cathedral-like mouths of the shells. The glass walls could not touch or load the precast concrete shells, and had to withstand extreme harbour gale-force winds while offering crystal-clear views of the water.",
      engineering: "Hall devised folded, prismatic glass walls canted forward at dynamic angles (up to 45 degrees) to minimize interior reflections and deflect solar heat. Over 2,000 sheets of custom laminated bronze-tinted glass (two panes of float glass bonded with a tinted polyvinyl butyral interlayer) were manufactured in France by Saint-Gobain. The panes are held in slender laminated plywood and bronze-anodized steel mullions suspended like delicate curtains from the shell arches.",
      materials: [
        "Custom French Saint-Gobain bronze-tinted laminated float glass (13.5mm thick)",
        "Curved laminated timber (plywood) mullions with bronze caps",
        "Structural bronze-anodized steel tension tie-backs",
        "Flexible silicone seismic and thermal expansion joints"
      ],
      loadTransmission: "Wind suction and pressure loads are transferred horizontally through curved timber/steel mullions into the base podium and shell arch anchoring pins.",
      image: "assets/layer_03_glass.jpg",
      diagram: "assets/diagram_shell_assembly.jpg",
      cameraTarget: { x: 0, y: 0.5, z: 0, distance: 13 }
    },

    {
      id: 2,
      key: "podium",
      title: "Monumental Stepped Concrete Podium",
      subTitleZh: "混凝土基座 (Monumental Podium)",
      category: "Substructure & Public Plateau",
      elevation: "0m to +12m",
      stage: "Stage I (1959–1963)",
      leadSummary: "A massive granite-clad stepped plateau inspired by Mayan and Aztec ceremonial platforms, spanning 100 metres wide with monumental entrance stairs.",
      concept: "Utzon's guiding philosophical breakthrough was to place all utilitarian spaces—rehearsal rooms, dressing rooms, scenery workshops, vehicular delivery docks, and plant rooms—inside a vast, solid stone 'podium'. By hiding the working machinery inside the base, the upper surface becomes a clean, elevated public plaza above which the light sculpture of the shells floats freely.",
      engineering: "Built by Civil & Civic as Stage I of construction. The podium is a colossal reinforced and prestressed concrete box girder structure. Its southern monumental steps span 100 metres (328 ft) in width, constructed from precast concrete folded slabs spanning across massive portal frames without intermediate support columns. The upper deck is paved in aggregate granite slabs that conceal rainwater drainage channels.",
      materials: [
        "Prestressed reinforced concrete portal frames and folded slab beams",
        "Reconstituted pink granite cladding slabs from Tarana, NSW",
        "Waterproofing membrane systems and concealed drainage gutters",
        "Heavy mass concrete retaining walls resisting harbour tidal water pressure"
      ],
      loadTransmission: "Acts as the rigid structural foundation, collecting all upper dead, live, and wind loads from the shells and auditoriums and transferring them into the bedrock below.",
      image: "assets/layer_02_podium.jpg",
      diagram: "assets/diagram_load_paths.jpg",
      cameraTarget: { x: 0, y: -0.5, z: 0, distance: 14 }
    },

    {
      id: 1,
      key: "waterfront",
      title: "Bennelong Point & Sydney Harbour Context",
      subTitleZh: "海港场地关系 (Harbour Waterfront)",
      category: "Site & Urban Maritime Context",
      elevation: "-25m to 0m (Sea Level)",
      stage: "Site Preparation (1958–1959)",
      leadSummary: "The historic Bennelong Point peninsula jutting into Sydney Harbour, connected to the city by broad waterfront boardwalks, ferries, and sandstone bedrock.",
      concept: "Bennelong Point—named after Woollarawarre Bennelong, a senior Eora man—is one of the most prominent natural promontories in the world. Utzon recognized that the site is visible from 360 degrees: from incoming ships, harbour ferries, the Harbour Bridge, and surrounding headlands. The building therefore had to have no 'back'—it had to be a pure three-dimensional sculpture in the round.",
      engineering: "Before construction could begin, the former Fort Macquarie Tram Depot was demolished in 1958. Engineers discovered that the promontory was composed of loose sea-fill and decomposed Hawkesbury sandstone. To support the 161,000-tonne superstructure, contractors drilled 588 mass concrete foundation piers (up to 2.1 metres in diameter), sinking them as deep as 25 metres (82 ft) below sea level into solid unweathered bedrock.",
      materials: [
        "Sydney Hawkesbury sandstone bedrock and marine sea wall blocks",
        "588 mass concrete foundation caissons and bored piers (up to 25m below sea level)",
        "Waterfront timber boardwalks and bronze harbour perimeter balustrades",
        "Salt-resistant marine concrete formulations with cathodic corrosion protection"
      ],
      loadTransmission: "Transfers the entire 161,000-tonne dead weight and environmental forces of the complex into the Sydney Hawkesbury sandstone bedrock.",
      image: "assets/layer_01_waterfront.jpg",
      diagram: "assets/diagram_site_plan.jpg",
      cameraTarget: { x: 0, y: -1.5, z: 0, distance: 16 }
    }
  ],

  diagrams: [
    {
      title: "Shell Segmentation & Spherical Geometry",
      src: "assets/diagram_shell_assembly.jpg",
      desc: "Utzon's 1961 discovery: every shell vault is derived as a segment of the exact same 75m radius sphere, allowing modular prefabrication."
    },
    {
      title: "Load Transmission Paths",
      src: "assets/diagram_load_paths.jpg",
      desc: "Membrane compression in roof shells -> Axial thrust down concrete rib arches -> Massive foundation podium -> Bedrock."
    },
    {
      title: "Precast Fan Rib Arch Structure",
      src: "assets/diagram_rib_structure.jpg",
      desc: "Radial precast concrete segments post-tensioned on site with steel cable tendons to form self-supporting arches."
    },
    {
      title: "Internal Spatial Section",
      src: "assets/diagram_internal_section.jpg",
      desc: "Longitudinal section showing seating tiers, stage machinery, public foyers, and vertical circulation paths."
    },
    {
      title: "Utzon Yellow Book Cross-Section (1962)",
      src: "assets/utzon_yellow_book_cross_section_1962.jpg",
      desc: "Original architectural section drawing submitted by Jørn Utzon to the NSW Government in January 1962."
    }
  ]
};
