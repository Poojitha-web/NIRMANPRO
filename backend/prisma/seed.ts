import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NIRMAN PRO Rate Database with Telangana Common SoR 2026-27...');

  // 1. Create Default Rate Source
  const rateSource = await prisma.rateSource.upsert({
    where: { id: 'telangana-sor-2026' },
    update: {
      status: 'ACTIVE',
    },
    create: {
      id: 'telangana-sor-2026',
      sourceName: 'Government of Telangana Common Schedule of Rates',
      sourceType: 'SSR',
      organization: 'Government of Telangana',
      edition: 'Part-III Buildings - Civil Items',
      year: '2026-27',
      effectiveDate: new Date('2026-06-01'),
      state: 'Telangana',
      location: 'Telangana (Zone-I, Zone-II, Zone-III)',
      reference: 'G.O.Ms.No.6, LET&F Dept., 30.05.2026 / Buildings Civil SoR',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Rate Source: ${rateSource.sourceName} (${rateSource.year}) initialized.`);

  // 2. Seed Labour Rates (Real Telangana SoR 2026-27 Data)
  const labourData = [
    { labourType: 'FOR THE YEAR 2026-27 (Skilled Supervisor)', category: 'Skilled', unit: 'Per Day', zoneIRate: 925, zoneIIRate: 885, zoneIIIRate: 845, dailyRate: 925 },
    { labourType: 'Skilled Blacksmith', category: 'Skilled', unit: 'Per Day', zoneIRate: 790, zoneIIRate: 750, zoneIIIRate: 710, dailyRate: 790 },
    { labourType: 'Skilled Rivetor & Blasterer', category: 'Skilled', unit: 'Per Day', zoneIRate: 925, zoneIIRate: 885, zoneIIIRate: 845, dailyRate: 925 },
    { labourType: 'Carpenter (Highly Skilled Class I)', category: 'Skilled', unit: 'Per Day', zoneIRate: 925, zoneIIRate: 885, zoneIIIRate: 845, dailyRate: 925 },
    { labourType: 'Electrician (Licensed / Class I)', category: 'Skilled', unit: 'Per Day', zoneIRate: 895, zoneIIRate: 855, zoneIIIRate: 815, dailyRate: 895 },
    { labourType: 'Fitter (Grade I / Class I)', category: 'Skilled', unit: 'Per Day', zoneIRate: 895, zoneIIRate: 855, zoneIIIRate: 815, dailyRate: 895 },
    { labourType: 'Tile & Flooring Layer / Polisher', category: 'Skilled', unit: 'Per Day', zoneIRate: 790, zoneIIRate: 750, zoneIIIRate: 710, dailyRate: 790 },
    { labourType: 'Foreman / Line Maistry Grade-I', category: 'Skilled', unit: 'Per Day', zoneIRate: 910, zoneIIRate: 870, zoneIIIRate: 830, dailyRate: 910 },
    { labourType: 'Work Inspector / SSC Maistry', category: 'Skilled', unit: 'Per Day', zoneIRate: 785, zoneIIRate: 745, zoneIIIRate: 705, dailyRate: 785 },
    { labourType: 'Mason (Class I / Brick Layer)', category: 'Skilled', unit: 'Per Day', zoneIRate: 925, zoneIIRate: 885, zoneIIIRate: 845, dailyRate: 925 },
    { labourType: 'Mechanic (Class I & II)', category: 'Skilled', unit: 'Per Day', zoneIRate: 795, zoneIIRate: 755, zoneIIIRate: 715, dailyRate: 795 },
    { labourType: 'Air Compressor & DG Set Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 830, zoneIIRate: 790, zoneIIIRate: 750, dailyRate: 830 },
    { labourType: 'Batching Plant Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 830, zoneIIRate: 790, zoneIIIRate: 750, dailyRate: 830 },
    { labourType: 'Heavy Vehicle Driver (Truck / Tanker / Lorry)', category: 'Skilled', unit: 'Per Day', zoneIRate: 900, zoneIIRate: 860, zoneIIIRate: 820, dailyRate: 900 },
    { labourType: 'Concrete & Asphalt Mixer Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 900, zoneIIRate: 860, zoneIIIRate: 820, dailyRate: 900 },
    { labourType: 'Asphalt Paver Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 840, zoneIIRate: 800, zoneIIIRate: 760, dailyRate: 840 },
    { labourType: 'Concrete Pump / Placer Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 840, zoneIIRate: 800, zoneIIIRate: 760, dailyRate: 840 },
    { labourType: 'Crane & Tower Crane Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 900, zoneIIRate: 860, zoneIIIRate: 820, dailyRate: 900 },
    { labourType: 'Jackhammer & Pneumatic Breaker Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 830, zoneIIRate: 790, zoneIIIRate: 750, dailyRate: 830 },
    { labourType: 'Road Roller Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 830, zoneIIRate: 790, zoneIIIRate: 750, dailyRate: 830 },
    { labourType: 'Excavator / JCB / Loader / Dozer Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 905, zoneIIRate: 865, zoneIIIRate: 825, dailyRate: 905 },
    { labourType: 'Tipper & Dumper Driver', category: 'Skilled', unit: 'Per Day', zoneIRate: 840, zoneIIRate: 800, zoneIIIRate: 760, dailyRate: 840 },
    { labourType: 'Vibrator & Compactor Operator', category: 'Skilled', unit: 'Per Day', zoneIRate: 840, zoneIIRate: 800, zoneIIIRate: 760, dailyRate: 840 },
    { labourType: 'Painter (Selection Grade)', category: 'Skilled', unit: 'Per Day', zoneIRate: 900, zoneIIRate: 860, zoneIIIRate: 820, dailyRate: 900 },
    { labourType: 'Plumber & Pipe Fitter (Class I)', category: 'Skilled', unit: 'Per Day', zoneIRate: 910, zoneIIRate: 870, zoneIIIRate: 830, dailyRate: 910 },
    { labourType: 'Rebar Steel Erector / Fabricator / Welder', category: 'Skilled', unit: 'Per Day', zoneIRate: 940, zoneIIRate: 900, zoneIIIRate: 860, dailyRate: 940 },

    // Semi-Skilled
    { labourType: 'Sprayman / Asphalt Sprayer', category: 'Semi Skilled', unit: 'Per Day', zoneIRate: 765, zoneIIRate: 725, zoneIIIRate: 685, dailyRate: 765 },
    { labourType: 'Assistant Carpenter / Shuttering Helper', category: 'Semi Skilled', unit: 'Per Day', zoneIRate: 830, zoneIIRate: 790, zoneIIIRate: 750, dailyRate: 830 },
    { labourType: 'Assistant Fitter / Machine Helper', category: 'Semi Skilled', unit: 'Per Day', zoneIRate: 765, zoneIIRate: 725, zoneIIIRate: 685, dailyRate: 765 },
    { labourType: 'Mason Helper / Construction Helper', category: 'Semi Skilled', unit: 'Per Day', zoneIRate: 765, zoneIIRate: 725, zoneIIIRate: 685, dailyRate: 765 },
    { labourType: 'Assistant Electrician / Plumber Helper', category: 'Semi Skilled', unit: 'Per Day', zoneIRate: 765, zoneIIRate: 725, zoneIIIRate: 685, dailyRate: 765 },
    { labourType: 'Assistant Welder / Bar Bender Helper', category: 'Semi Skilled', unit: 'Per Day', zoneIRate: 765, zoneIIRate: 725, zoneIIIRate: 685, dailyRate: 765 },

    // Unskilled
    { labourType: 'Unskilled Mazdoor / Labourer (General)', category: 'Unskilled', unit: 'Per Day', zoneIRate: 715, zoneIIRate: 675, zoneIIIRate: 635, dailyRate: 715 },
    { labourType: 'Watchman / Chowkidar / Security Guard', category: 'Unskilled', unit: 'Per Day', zoneIRate: 715, zoneIIRate: 675, zoneIIIRate: 635, dailyRate: 715 },
    { labourType: 'Sweeper / Site Cleaner', category: 'Unskilled', unit: 'Per Day', zoneIRate: 715, zoneIIRate: 675, zoneIIIRate: 635, dailyRate: 715 },

    // Other Technical
    { labourType: 'Diploma Engineer / Surveyor', category: 'Other', unit: 'Per Day', zoneIRate: 1290, zoneIIRate: 1250, zoneIIIRate: 1210, dailyRate: 1290 },
    { labourType: 'Graduate Engineer (B.E. / B.Tech)', category: 'Other', unit: 'Per Day', zoneIRate: 1615, zoneIIRate: 1575, zoneIIIRate: 1535, dailyRate: 1615 },
    { labourType: 'CAD Operator / Draftsman', category: 'Other', unit: 'Per Day', zoneIRate: 1290, zoneIIRate: 1250, zoneIIIRate: 1210, dailyRate: 1290 },
  ];

  for (const l of labourData) {
    await prisma.labourRate.upsert({
      where: { labourType: l.labourType },
      update: {
        dailyRate: l.dailyRate,
        zoneIRate: l.zoneIRate,
        zoneIIRate: l.zoneIIRate,
        zoneIIIRate: l.zoneIIIRate,
        rateSourceId: rateSource.id,
        rateAuthority: 'G.O.Ms.No.6, LET&F Dept., 30.05.2026',
      },
      create: {
        ...l,
        rateSourceId: rateSource.id,
        source: 'Government of Telangana Common Schedule of Rates 2026-27',
        rateAuthority: 'G.O.Ms.No.6, LET&F Dept., 30.05.2026',
        effectiveDate: new Date('2026-06-01'),
      },
    });
  }

  console.log(`✅ Seeded ${labourData.length} Labour Rates with Zone-I, Zone-II, and Zone-III pricing.`);

  // 3. Seed Equipment Rates (Real Telangana SoR 2026-27 Data)
  const equipmentData = [
    { equipmentName: 'Agitator car / Transit mixer 2 cum', unit: 'Hour', zoneIHire: 952.2, zoneIFuel: 1570.3, zoneICrew: 519.5, zoneITotal: 3042, zoneIIHire: 952.2, zoneIIFuel: 1570.3, zoneIICrew: 494.5, zoneIITotal: 3017, zoneIIIHire: 952.2, zoneIIIFuel: 1570.3, zoneIIICrew: 469.6, zoneIIITotal: 2992.1, hourlyRate: 3042 },
    { equipmentName: 'Air compressor 5 cmm ( electric )', unit: 'Hour', zoneIHire: 127.9, zoneIFuel: 362.6, zoneICrew: 311, zoneITotal: 801.5, zoneIIHire: 127.9, zoneIIFuel: 362.6, zoneIICrew: 295.4, zoneIITotal: 785.9, zoneIIIHire: 127.9, zoneIIIFuel: 362.6, zoneIIICrew: 279.8, zoneIIITotal: 770.3, hourlyRate: 801.5 },
    { equipmentName: 'Air compressor 7 cmm ( diesel )', unit: 'Hour', zoneIHire: 285.1, zoneIFuel: 1284.8, zoneICrew: 398.1, zoneITotal: 1968, zoneIIHire: 285.1, zoneIIFuel: 1284.8, zoneIICrew: 378.1, zoneIITotal: 1948, zoneIIIHire: 285.1, zoneIIIFuel: 1284.8, zoneIIICrew: 358.2, zoneIIITotal: 1928.1, hourlyRate: 1968 },
    { equipmentName: 'Batching plant 0.5 cum ( 6 cum/hr )', unit: 'Hour', zoneIHire: 136, zoneIFuel: 161.1, zoneICrew: 623.3, zoneITotal: 920.4, zoneIIHire: 136, zoneIIFuel: 161.1, zoneIICrew: 593.3, zoneIITotal: 890.4, zoneIIIHire: 136, zoneIIIFuel: 161.1, zoneIIICrew: 563.4, zoneIIITotal: 860.5, hourlyRate: 920.4 },
    { equipmentName: 'Batching plant 2 x 1.00 cum (15 cum/hr)', unit: 'Hour', zoneIHire: 455, zoneIFuel: 483.4, zoneICrew: 623.3, zoneITotal: 1561.7, zoneIIHire: 455, zoneIIFuel: 483.4, zoneIICrew: 593.3, zoneIITotal: 1531.7, zoneIIIHire: 455, zoneIIIFuel: 483.4, zoneIIICrew: 563.4, zoneIIITotal: 1501.8, hourlyRate: 1561.7 },
    { equipmentName: 'Concrete mixer 300 / 200 ( diesel )', unit: 'Hour', zoneIHire: 67.2, zoneIFuel: 142.8, zoneICrew: 417.3, zoneITotal: 627.3, zoneIIHire: 67.2, zoneIIFuel: 142.8, zoneIICrew: 396.5, zoneIITotal: 606.5, zoneIIIHire: 67.2, zoneIIIFuel: 142.8, zoneIIICrew: 375.7, zoneIIITotal: 585.7, hourlyRate: 627.3 },
    { equipmentName: 'Concrete mixer 600 / 400 ( diesel )', unit: 'Hour', zoneIHire: 109.8, zoneIFuel: 285.5, zoneICrew: 417.3, zoneITotal: 812.6, zoneIIHire: 109.8, zoneIIFuel: 285.5, zoneIICrew: 396.5, zoneIITotal: 791.8, zoneIIIHire: 109.8, zoneIIIFuel: 285.5, zoneIIICrew: 375.7, zoneIIITotal: 771, hourlyRate: 812.6 },
    { equipmentName: 'Diesel generating set 50 KVA', unit: 'Hour', zoneIHire: 116.5, zoneIFuel: 1713, zoneICrew: 248.8, zoneITotal: 2078.3, zoneIIHire: 116.5, zoneIIFuel: 1713, zoneIICrew: 236.3, zoneIITotal: 2065.8, zoneIIIHire: 116.5, zoneIIIFuel: 1713, zoneIIICrew: 223.9, zoneIIITotal: 2053.4, hourlyRate: 2078.3 },
    { equipmentName: 'Dumper 4.5 cum', unit: 'Hour', zoneIHire: 740, zoneIFuel: 719.5, zoneICrew: 415.6, zoneITotal: 1875.1, zoneIIHire: 740, zoneIIFuel: 719.5, zoneIICrew: 395.6, zoneIITotal: 1855.1, zoneIIIHire: 740, zoneIIIFuel: 719.5, zoneIIICrew: 375.6, zoneIIITotal: 1835.1, hourlyRate: 1875.1 },
    { equipmentName: 'Jack hammer', unit: 'Hour', zoneIHire: 24.6, zoneIFuel: 0, zoneICrew: 622.1, zoneITotal: 646.7, zoneIIHire: 24.6, zoneIIFuel: 0, zoneIICrew: 590.9, zoneIITotal: 615.5, zoneIIIHire: 24.6, zoneIIIFuel: 0, zoneIIICrew: 559.7, zoneIIITotal: 584.3, hourlyRate: 646.7 },
    { equipmentName: 'Needle vibrator 40 mm (petrol)', unit: 'Hour', zoneIHire: 7.3, zoneIFuel: 31.8, zoneICrew: 300.4, zoneITotal: 339.5, zoneIIHire: 7.3, zoneIIFuel: 31.8, zoneIICrew: 285.4, zoneIITotal: 324.5, zoneIIIHire: 7.3, zoneIIIFuel: 31.8, zoneIIICrew: 270.4, zoneIIITotal: 309.5, hourlyRate: 339.5 },
    { equipmentName: 'Road roller diesel 10 t', unit: 'Hour', zoneIHire: 253.1, zoneIFuel: 1284.8, zoneICrew: 416.8, zoneITotal: 1954.7, zoneIIHire: 253.1, zoneIIFuel: 1284.8, zoneIICrew: 396.9, zoneIITotal: 1934.8, zoneIIIHire: 253.1, zoneIIIFuel: 1284.8, zoneIIICrew: 376.9, zoneIIITotal: 1914.8, hourlyRate: 1954.7 },
    { equipmentName: 'Excavator / Shovel 0.85 cum 110 hp', unit: 'Hour', zoneIHire: 1964.8, zoneIFuel: 1570.3, zoneICrew: 434.2, zoneITotal: 3969.3, zoneIIHire: 1964.8, zoneIIFuel: 1570.3, zoneIICrew: 413.4, zoneIITotal: 3948.5, zoneIIIHire: 1964.8, zoneIIIFuel: 1570.3, zoneIIICrew: 392.6, zoneIIITotal: 3927.7, hourlyRate: 3969.3 },
    { equipmentName: 'Tipper 5 cum', unit: 'Hour', zoneIHire: 581.3, zoneIFuel: 539.6, zoneICrew: 324.7, zoneITotal: 1445.6, zoneIIHire: 581.3, zoneIIFuel: 539.6, zoneIICrew: 309.1, zoneIITotal: 1430, zoneIIIHire: 581.3, zoneIIIFuel: 539.6, zoneIIICrew: 293.5, zoneIIITotal: 1414.4, hourlyRate: 1445.6 },
    { equipmentName: 'Tower crane 5 tonne', unit: 'Hour', zoneIHire: 1009, zoneIFuel: 279.3, zoneICrew: 346.3, zoneITotal: 1634.6, zoneIIHire: 1009, zoneIIFuel: 279.3, zoneIICrew: 329.7, zoneIITotal: 1618, zoneIIIHire: 1009, zoneIIIFuel: 279.3, zoneIIICrew: 313, zoneIIITotal: 1601.3, hourlyRate: 1634.6 },
    { equipmentName: 'Truck 10 t', unit: 'Hour', zoneIHire: 530.2, zoneIFuel: 539.6, zoneICrew: 324.7, zoneITotal: 1394.5, zoneIIHire: 530.2, zoneIIFuel: 539.6, zoneIICrew: 309.1, zoneIITotal: 1378.9, zoneIIIHire: 530.2, zoneIIIFuel: 539.6, zoneIIICrew: 293.5, zoneIIITotal: 1363.3, hourlyRate: 1394.5 },
    { equipmentName: 'Hydraulic Truck Crane 30T', unit: 'Hour', zoneIHire: 3821.8, zoneIFuel: 118.8, zoneICrew: 988.4, zoneITotal: 4929, zoneIIHire: 3821.8, zoneIIFuel: 118.8, zoneIICrew: 938.5, zoneIITotal: 4879.1, zoneIIIHire: 3821.8, zoneIIIFuel: 118.8, zoneIIICrew: 888.6, zoneIIITotal: 4829.2, hourlyRate: 4929 },
    { equipmentName: 'Water tanker 8000 ltr', unit: 'Hour', zoneIHire: 495.6, zoneIFuel: 539.6, zoneICrew: 324.7, zoneITotal: 1359.9, zoneIIHire: 495.6, zoneIIFuel: 539.6, zoneIICrew: 309.1, zoneIITotal: 1344.3, zoneIIIHire: 495.6, zoneIIIFuel: 539.6, zoneIIICrew: 293.5, zoneIIITotal: 1328.7, hourlyRate: 1359.9 },
  ];

  for (const eq of equipmentData) {
    await prisma.equipmentRate.upsert({
      where: { equipmentName: eq.equipmentName },
      update: {
        hourlyRate: eq.hourlyRate,
        zoneIHire: eq.zoneIHire,
        zoneIFuel: eq.zoneIFuel,
        zoneICrew: eq.zoneICrew,
        zoneITotal: eq.zoneITotal,
        zoneIIHire: eq.zoneIIHire,
        zoneIIFuel: eq.zoneIIFuel,
        zoneIICrew: eq.zoneIICrew,
        zoneIITotal: eq.zoneIITotal,
        zoneIIIHire: eq.zoneIIIHire,
        zoneIIIFuel: eq.zoneIIIFuel,
        zoneIIICrew: eq.zoneIIICrew,
        zoneIIITotal: eq.zoneIIITotal,
        rateSourceId: rateSource.id,
      },
      create: {
        ...eq,
        rateSourceId: rateSource.id,
        source: 'Government of Telangana Common Schedule of Rates 2026-27',
        effectiveDate: new Date('2026-06-01'),
      },
    });
  }

  console.log(`✅ Seeded ${equipmentData.length} Equipment Rates with Hire/Fuel/Crew cost splits.`);

  // 4. Seed Material Rates from SoR Items
  const primaryMaterials = [
    { materialName: 'Common burnt clay bricks (23 x 11 x 7 cm)', materialCode: 'TBSC-A.I-01', unit: 'Each', unitRate: 9, category: 'BRICKS & BUILDING BLOCKS' },
    { materialName: 'Fly ash cement/lime solid blocks (290 x 225 x 140 mm)', materialCode: 'TBSC-A.II-01', unit: 'Each', unitRate: 30, category: 'BRICKS & BUILDING BLOCKS' },
    { materialName: 'Autoclaved Aerated Concrete (AAC) Blocks (600 x 200 x 100 mm)', materialCode: 'TBSC-A.III-198', unit: 'Each', unitRate: 66, category: 'BRICKS & BUILDING BLOCKS' },
    { materialName: 'Polished Shahabad / Tandur Stone Slabs (15-18 mm)', materialCode: 'TBSC-B.I-03', unit: 'Sqm', unitRate: 291, category: 'NATURAL FLOORING STONES' },
    { materialName: 'High Polished Granite Slabs (16-18 mm thick)', materialCode: 'TBSC-B.III-01', unit: 'Sqm', unitRate: 2789, category: 'NATURAL FLOORING STONES' },
    { materialName: 'Non-skid Ceramic Floor Tiles (300 x 300 mm IS:15622)', materialCode: 'TBSC-C.I-01', unit: 'Sqm', unitRate: 334, category: 'WALL & FLOOR TILES' },
    { materialName: 'Soluble Salt Vitrified Tiles (600 x 600 mm IS:15622)', materialCode: 'TBSC-C.II-01', unit: 'Sqm', unitRate: 470, category: 'WALL & FLOOR TILES' },
    { materialName: 'Double Charged Vitrified Tiles (600 x 600 mm IS:15622)', materialCode: 'TBSC-C.II-05', unit: 'Sqm', unitRate: 613, category: 'WALL & FLOOR TILES' },
    { materialName: 'Glazed Ceramic Wall Tiles (300 x 450 mm IS:15622)', materialCode: 'TBSC-C.III-02', unit: 'Sqm', unitRate: 445, category: 'WALL & FLOOR TILES' },
    { materialName: 'Pre-painted Galvalume Roofing Sheets (0.50mm AZ150)', materialCode: 'TBSC-D.VI-05', unit: 'Sqm', unitRate: 511, category: 'TIMBER & ROOFING MATERIALS' },
    { materialName: 'Structural Steel Hollow Square & Rectangular Sections (IS 4923)', materialCode: 'TBSC-E.I-16', unit: 'Kg', unitRate: 90, category: 'STEEL MATERIALS' },
    { materialName: 'Toughened Plain Glass 6 mm thick', materialCode: 'TBSC-F.V-02', unit: 'Sqm', unitRate: 1232, category: 'GLASS MATERIALS' },
    { materialName: 'Water based Cement Primer Interior (Grade 1)', materialCode: 'TBSC-G.I-01', unit: 'Kg', unitRate: 179, category: 'PAINTS & POLISHES' },
    { materialName: 'Acrylic Emulsion Paint Interior Grade (VOC < 30 g/L)', materialCode: 'TBSC-G.III-01', unit: 'Lit', unitRate: 233, category: 'PAINTS & POLISHES' },
    { materialName: 'Synthetic Enamel Paint (IS 14209 Grade I)', materialCode: 'TBSC-G.V-01', unit: 'Lit', unitRate: 299, category: 'PAINTS & POLISHES' },
    { materialName: 'Melamine Faced Particle Board 18 mm (IS 3129)', materialCode: 'TBSC-H.I-03', unit: 'Sqm', unitRate: 1060, category: 'PARTICLE BOARDS' },
    { materialName: 'Commercial Plywood 12 mm (IS 303 MR Grade)', materialCode: 'TBSC-J.I-05', unit: 'Sqm', unitRate: 791, category: 'PLYWOODS & LAMINATES' },
    { materialName: 'Gypsum Board False Ceiling Tiles 12.5 mm (IS 2095)', materialCode: 'TBSC-K.I-01', unit: 'Sqm', unitRate: 337, category: 'CEILINGS & PARTITIONS' },
    { materialName: 'Super Plasticizer Water Reducing Admixture (IS 9103)', materialCode: 'TBSC-Q.I-01', unit: 'Ltr', unitRate: 242, category: 'CONSTRUCTION CHEMICALS' },
    { materialName: 'Integral Cement Waterproofing Liquid (IS 2645-2003)', materialCode: 'TBSC-Q.II-01', unit: 'Ltr', unitRate: 253, category: 'CONSTRUCTION CHEMICALS' },
    { materialName: 'White Cement (IS 8042-1989)', materialCode: 'TBSC-R.I-01', unit: 'Kg', unitRate: 41, category: 'MISCELLANEOUS ITEMS' },
  ];

  for (const m of primaryMaterials) {
    await prisma.materialRate.upsert({
      where: { materialName: m.materialName },
      update: { unitRate: m.unitRate, rateSourceId: rateSource.id },
      create: {
        ...m,
        rateSourceId: rateSource.id,
        source: 'Government of Telangana Common Schedule of Rates 2026-27',
        effectiveDate: new Date('2026-06-01'),
      },
    });
  }

  console.log(`✅ Seeded ${primaryMaterials.length} Primary Material Rates.`);

  // 5. Seed Admin User
  const passwordHash = await bcrypt.hash('Password123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@nirmanpro.com' },
    update: { isVerified: true },
    create: {
      name: 'System Admin',
      email: 'admin@nirmanpro.com',
      emailNormalized: 'admin@nirmanpro.com',
      mobileNumber: '+919876543210',
      companyName: 'NIRMAN PRO Global',
      role: 'ADMIN',
      passwordHash,
      isVerified: true,
      authenticationProvider: 'email',
    },
  });

  console.log('✅ Seeded NIRMAN PRO Admin User (admin@nirmanpro.com / Password123!)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
