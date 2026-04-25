/* ═══════════════════════════════════════════════════════
   DATA.JS — Static data for the simulator
   ═══════════════════════════════════════════════════════ */
const DATA = {
  stepsRC: [
    {num:1,title:'Monitoreo del cultivo',subtitle:'Verificación antes de cosechar',body:'Se mide la densidad óptica (DO) a 560 nm para confirmar fase estacionaria. pH entre 9–10, color verde intenso uniforme, 7–14 días desde inoculación.',params:[{n:'DO 560 nm',v:'Alta absorbancia'},{n:'pH',v:'9.0 – 10.0'},{n:'Color',v:'Verde intenso'},{n:'Días mín.',v:'7 – 14 días'}],note:'No cosechar si presenta coloración amarillenta o contaminantes visibles.',noteType:'warn',anim:'monitor'},
    {num:2,title:'Filtración con malla fina',subtitle:'Separación física de la biomasa',body:'La biomasa se separa del medio pasando por malla de 50–100 µm. Se retienen las células de Spirulina.',params:[{n:'Malla',v:'50 – 100 µm'},{n:'Método',v:'Gravedad / presión'},{n:'Medio',v:'Descartar o reutilizar'},{n:'Temp.',v:'Ambiente (< 35°C)'}],note:'Mantener biomasa húmeda. Evitar luz solar directa.',noteType:'warn',anim:'filtro'},
    {num:3,title:'Lavado con agua destilada',subtitle:'Eliminación de sales del medio Zarrouk',body:'2–3 lavados con agua destilada para eliminar NaHCO₃, NaNO₃ y demás sales.',params:[{n:'Lavados',v:'2 – 3 ciclos'},{n:'Agua',v:'Destilada estéril'},{n:'Objetivo',v:'Retirar sales'},{n:'pH post',v:'Neutro (≈ 7)'}],note:'El lavado es crítico para la calidad del biofertilizante.',noteType:'warn',anim:'lavado'},
    {num:4,title:'Secado o uso en fresco',subtitle:'Tipo de formulación',body:'Fresco: 1:10 en agua, 15 días a 4°C. Seco: estufa a 40°C, hasta 6 meses.',params:[{n:'Secado',v:'40°C peso constante'},{n:'Fresca',v:'1:10 en agua'},{n:'Vida fresca',v:'Máx. 15 días (4°C)'},{n:'Vida seca',v:'Hasta 6 meses'}],note:'Nunca secar a >45°C.',noteType:'warn',anim:'secado'},
    {num:5,title:'Formulación del biofertilizante',subtitle:'Solución final para aplicación',body:'Suelo: 20%, Foliar: 10%, Semillas: 5%. pH final 6.5–7.0.',params:[{n:'Suelo',v:'Dilución 20%'},{n:'Foliar',v:'Dilución 10%'},{n:'Semillas',v:'Dilución 5%'},{n:'pH final',v:'6.5 – 7.0'}],note:'Agregar melaza al 1% como estabilizante.',noteType:'ok',anim:'formula'},
    {num:6,title:'Conservación y almacenamiento',subtitle:'Mantener calidad biológica',body:'Recipientes oscuros herméticos a 4°C. No congelar. Máx 15 días.',params:[{n:'Temp.',v:'4°C (refrigerado)'},{n:'Recipiente',v:'Ámbar / oscuro'},{n:'Tiempo máx.',v:'15 días (fresco)'},{n:'Restricción',v:'No congelar'}],note:'Degradación proteica tras 15 días.',noteType:'warn',anim:'conserva'}
  ],

  glosES: [
    {term:'Spirulina platensis',en:'Spirulina platensis',cat:'bio',tag:'Biología',short:'Cianobacteria filamentosa; microorganismo principal del proyecto SpiruFert.',detail:'Procariota fotosintético. 60–70% proteínas, vitaminas B, hierro, ficocianina. pH 9–10, 28–32°C.',param:'pH: 9–10 · Temp: 28–32°C'},
    {term:'Ficocianina',en:'Phycocyanin',cat:'bio',tag:'Biología',short:'Pigmento azul de Spirulina con propiedades antioxidantes.',detail:'Proteína pigmentada. Antioxidante vegetal y bioestimulante sobre germinación. λ ≈ 620 nm.',param:'λ ≈ 620 nm'},
    {term:'Clorofila',en:'Chlorophyll',cat:'bio',tag:'Biología',short:'Pigmento fotosintético verde. Depende del hierro (Fe).',detail:'Absorbe a 680 nm (rojo) y 450 nm (azul). Deficiencia de Fe = clorosis.',param:'450 nm y 680 nm'},
    {term:'Clorosis',en:'Chlorosis',cat:'bio',tag:'Biología',short:'Pérdida de color verde por deficiencia de hierro.',detail:'Fe <0.05 g/L reduce clorofila. Reversible corrigiendo FeSO₄.',param:'Fe < 0.05 g/L'},
    {term:'Bioestimulante',en:'Biostimulant',cat:'bio',tag:'Biología',short:'Mejora tolerancia vegetal al estrés y absorción de nutrientes.',detail:'Aminoácidos, fitohormonas, polisacáridos de microalgas.',param:'Foliar: c/10 días · 10%'},
    {term:'Microalgas',en:'Microalgae',cat:'bio',tag:'Biología',short:'Microorganismos fotosintéticos productores de biomasa.',detail:'Unicelulares o filamentosos. Controlando pH, luz, temperatura y CO₂.',param:'Tamaño: 1–500 µm'},
    {term:'Fijación de nitrógeno',en:'Nitrogen fixation',cat:'bio',tag:'Biología',short:'Conversión de N₂ atmosférico en NH₃ por nitrogenasa.',detail:'Reduce dependencia de fertilizantes nitrogenados sintéticos.',param:'Enzima: nitrogenasa'},
    {term:'Medio Zarrouk',en:'Zarrouk medium',cat:'quim',tag:'Química',short:'Medio estándar para Spirulina (1966). NaHCO₃ 16.8 g/L.',detail:'NaHCO₃, NaNO₃, K₂HPO₄, FeSO₄, EDTA. Esterilizar 121°C/15 min.',param:'121°C · 15 min'},
    {term:'Medio Jordán',en:'Jordán medium',cat:'quim',tag:'Química',short:'Variante simplificada con 5 componentes principales.',detail:'NaHCO₃ 8 g/L, KNO₃ 2 g/L, NH₄H₂PO₄ 0.2 g/L, Sal 24 ppm, FeSO₄ 0.1 g/L.',param:'5 componentes'},
    {term:'Densidad óptica (DO)',en:'Optical Density',cat:'quim',tag:'Química',short:'Absorbancia a 560 nm para monitorear crecimiento.',detail:'DO > 1.0 = cultivo denso. DO 1.8–2.5 = cosecha.',param:'λ = 560 nm'},
    {term:'NaHCO₃',en:'Sodium bicarbonate',cat:'quim',tag:'Química',short:'Fuente de carbono y tampón alcalino.',detail:'Zarrouk: 16.8 g/L. Jordán: 8 g/L. Mantiene pH 9–10.',param:'Jordán: 8 g/L'},
    {term:'pH del cultivo',en:'Culture pH',cat:'quim',tag:'Química',short:'Spirulina requiere pH alcalino 9–10.',detail:'<8: inhibe fotosíntesis. >11: desnaturaliza proteínas.',param:'Óptimo: 9–10'},
    {term:'Fase lag',en:'Lag phase',cat:'proc',tag:'Proceso',short:'Adaptación metabólica (0–4 días).',detail:'Sin aumento visible de biomasa. Minimizar con inóculo 15–20%.',param:'0–4 días'},
    {term:'Fase exponencial',en:'Exponential phase',cat:'proc',tag:'Proceso',short:'Máximo crecimiento (días 4–14).',detail:'Biomasa se duplica exponencialmente. Mayor demanda de nutrientes.',param:'Días 4–14'},
    {term:'Fase estacionaria',en:'Stationary phase',cat:'proc',tag:'Proceso',short:'Equilibrio. Máxima biomasa. Ideal para cosechar.',detail:'Reproducción = mortalidad. DO560 máxima (1.8–2.5).',param:'DO máxima'},
    {term:'Factor de Crecimiento (FC)',en:'Growth Factor',cat:'proc',tag:'Proceso',short:'FC = (NO₃×0.4) + (PO₄×0.3) + (Sal×0.3).',detail:'FC=1.0 perfecto. FC<0.4 en riesgo. Se multiplica por factores ambientales.',param:'FC > 0.9'},
    {term:'Fotoperiodo',en:'Photoperiod',cat:'proc',tag:'Proceso',short:'Ciclo luz/oscuridad. Óptimo 12h/12h.',detail:'Oscuridad necesaria para respiración y síntesis proteica.',param:'12h/12h'},
    {term:'Estrés osmótico',en:'Osmotic stress',cat:'proc',tag:'Proceso',short:'Sal <13 ppm = lisis. >35 ppm = plasmólisis.',detail:'Desequilibrio detiene crecimiento y favorece contaminación.',param:'Crítico: <8 o >55 ppm'},
    {term:'Biofertilizante',en:'Biofertilizer',cat:'agro',tag:'Agronomía',short:'Insumo biológico que mejora nutrientes del suelo.',detail:'Suelo: 50–100 mL/planta. Foliar: 10%. Semillas: 5%.',param:'50–100 mL/planta'},
    {term:'Capsicum annuum',en:'Chili pepper',cat:'agro',tag:'Agronomía',short:'Ají — cultivo objetivo del biofertilizante.',detail:'pH 6.0–7.0. Responde a bioestimulantes.',param:'pH: 6.0–7.0'},
    {term:'Fertilidad del suelo',en:'Soil fertility',cat:'agro',tag:'Agronomía',short:'Capacidad de suministrar nutrientes biodisponibles.',detail:'pH, materia orgánica (3–6%), CIC, NPK.',param:'M.O.: 3–6%'},
  ],

  glosEN: [
    {term:'Spirulina platensis',cat:'bio',short:'Filamentous cyanobacterium; primary microalgae.',detail:'60–70% proteins, B-vitamins, iron, phycocyanin. pH 9–10, 28–32°C.',param:'pH: 9–10 · 28–32°C'},
    {term:'Phycocyanin',cat:'bio',short:'Blue pigment with antioxidant properties.',detail:'Absorbs at λ ≈ 620 nm. Biostimulant on germination.',param:'λ ≈ 620 nm'},
    {term:'Chlorophyll',cat:'bio',short:'Green photosynthetic pigment. Depends on iron.',detail:'Absorbs 680 nm (red) and 450 nm (blue). Fe deficiency = chlorosis.',param:'450 nm and 680 nm'},
    {term:'Microalgae',cat:'bio',short:'Photosynthetic microorganisms producing biomass.',detail:'Cultured controlling pH, light, temperature and CO₂.',param:'Size: 1–500 µm'},
    {term:'Biostimulant',cat:'bio',short:'Enhances plant stress tolerance.',detail:'Amino acids, phytohormones, polysaccharides from microalgae.',param:'Foliar: every 10 days'},
    {term:'Zarrouk Medium',cat:'quim',short:'Standard culture medium (1966).',detail:'NaHCO₃ 16.8 g/L, NaNO₃ 2.5 g/L, FeSO₄, EDTA.',param:'121°C · 15 min'},
    {term:'Optical Density (OD)',cat:'quim',short:'Absorbance at 560 nm.',detail:'OD 1.8–2.5 = harvest ready.',param:'λ = 560 nm'},
    {term:'Sodium bicarbonate',cat:'quim',short:'Main carbon source and pH buffer.',detail:'Zarrouk: 16.8 g/L. Jordán: 8 g/L.',param:'Jordán: 8 g/L'},
    {term:'Lag phase',cat:'proc',short:'Adaptation phase (0–4 days).',detail:'No visible biomass increase. Use 15–20% inoculum.',param:'0–4 days'},
    {term:'Exponential phase',cat:'proc',short:'Maximum growth (days 4–14).',detail:'Biomass doubles exponentially.',param:'Days 4–14'},
    {term:'Stationary phase',cat:'proc',short:'Equilibrium. Maximum biomass. Harvest point.',detail:'Growth = mortality. OD560 at peak.',param:'Max OD'},
    {term:'Growth Factor (GF)',cat:'proc',short:'GF = (NO₃×0.4)+(PO₄×0.3)+(Salt×0.3).',detail:'GF=1.0 perfect. GF<0.4 at risk.',param:'GF > 0.9'},
    {term:'Photoperiod',cat:'proc',short:'Light/dark cycle. Optimal 12h/12h.',detail:'Dark period for respiration and protein synthesis.',param:'12h/12h'},
    {term:'Osmotic stress',cat:'proc',short:'Salt <13 ppm = lysis. >35 ppm = plasmolysis.',detail:'Imbalance stops growth.',param:'Critical: <8 or >55 ppm'},
    {term:'Biofertilizer',cat:'agro',short:'Biological input improving soil nutrients.',detail:'Soil: 50–100 mL/plant. Foliar: 10%.',param:'50–100 mL/plant'},
    {term:'Capsicum annuum',cat:'agro',short:'Chili pepper — target crop.',detail:'pH 6.0–7.0. Responsive to biostimulants.',param:'pH: 6.0–7.0'},
    {term:'Soil fertility',cat:'agro',short:'Ability to supply bioavailable nutrients.',detail:'pH, organic matter (3–6%), CEC, NPK.',param:'O.M.: 3–6%'},
  ],

  tagEN: {bio:'Biology',quim:'Chemistry',proc:'Process',agro:'Agronomy'},

  rangos: [
    {cls:'rc-ph',var:'pH del medio',val:'9.0 – 10.0',unit:'Escala pH',bars:[{h:30,c:'rgba(226,75,74,.5)'},{h:55,c:'rgba(239,159,39,.7)'},{h:100,c:'#1D9E75'},{h:55,c:'rgba(239,159,39,.7)'},{h:20,c:'rgba(226,75,74,.5)'}],nota:'Óptimo: <strong style="color:#9FE1CB">9.0–10.0</strong> · Aceptable: 8.0–11.0'},
    {cls:'rc-temp',var:'Temperatura',val:'28 – 32 °C',unit:'Grados Celsius',bars:[{h:20,c:'rgba(133,183,235,.5)'},{h:60,c:'rgba(239,159,39,.7)'},{h:100,c:'#EF9F27'},{h:60,c:'rgba(239,159,39,.7)'},{h:20,c:'rgba(226,75,74,.5)'}],nota:'Óptimo: <strong style="color:#FAC775">28–32°C</strong> · >38°C muerte celular'},
    {cls:'rc-luz',var:'Intensidad luminosa',val:'6 000 – 8 000 lux',unit:'Lux (lm/m²)',bars:[{h:25,c:'rgba(133,183,235,.5)'},{h:60,c:'rgba(239,159,39,.7)'},{h:100,c:'#FAC775'},{h:60,c:'rgba(239,159,39,.7)'},{h:30,c:'rgba(226,75,74,.5)'}],nota:'Óptimo: <strong style="color:#FAC775">6–8k lux</strong> · >10k fotoinhibición'},
    {cls:'rc-co2',var:'CO₂ en aireación',val:'1.5 – 3.0 %',unit:'% volumétrico',bars:[{h:30,c:'rgba(133,183,235,.5)'},{h:65,c:'rgba(239,159,39,.7)'},{h:100,c:'#85B7EB'},{h:65,c:'rgba(239,159,39,.7)'},{h:25,c:'rgba(226,75,74,.5)'}],nota:'Óptimo: <strong style="color:#85B7EB">1.5–3.0%</strong> · >5% acidificación'},
    {cls:'rc-bic',var:'Bicarbonato (NaHCO₃)',val:'8.0 – 10.0 g/L',unit:'g/L · Medio Jordán',bars:[{h:25,c:'rgba(226,75,74,.5)'},{h:65,c:'rgba(239,159,39,.7)'},{h:100,c:'#9FE1CB'},{h:65,c:'rgba(239,159,39,.7)'},{h:25,c:'rgba(226,75,74,.5)'}],nota:'Jordán: <strong style="color:#9FE1CB">8 g/L</strong> · Zarrouk: 16.8 g/L'},
    {cls:'rc-nit',var:'Nitrato de Potasio (KNO₃)',val:'2.0 – 3.5 g/L',unit:'g/L · Fuente de nitrógeno',bars:[{h:20,c:'rgba(226,75,74,.5)'},{h:60,c:'rgba(239,159,39,.7)'},{h:100,c:'#ED93B1'},{h:55,c:'rgba(239,159,39,.7)'},{h:20,c:'rgba(226,75,74,.5)'}],nota:'Jordán: <strong style="color:#ED93B1">2 g/L</strong> · Estrés N → lípidos'},
    {cls:'rc-foto',var:'Fotoperiodo',val:'10 – 14 h luz',unit:'Horas de luz / 24h',bars:[{h:30,c:'rgba(133,183,235,.5)'},{h:65,c:'rgba(239,159,39,.7)'},{h:100,c:'#7F77DD'},{h:65,c:'rgba(239,159,39,.7)'},{h:35,c:'rgba(226,75,74,.4)'}],nota:'Óptimo: <strong style="color:#7F77DD">12h/12h</strong>'},
    {cls:'',var:'Fosfato (NH₄H₂PO₄)',val:'0.15 – 0.25 g/L',unit:'g/L · Fuente de fósforo',bars:[{h:20,c:'rgba(226,75,74,.5)'},{h:55,c:'rgba(239,159,39,.7)'},{h:100,c:'#378ADD'},{h:55,c:'rgba(239,159,39,.7)'},{h:25,c:'rgba(226,75,74,.5)'}],nota:'Óptimo: <strong style="color:#378ADD">0.2 g/L</strong>',barColor:'#378ADD'},
    {cls:'',var:'Sal Marina (NaCl)',val:'13 – 35 ppm',unit:'ppm · Control osmótico',bars:[{h:20,c:'rgba(226,75,74,.5)'},{h:55,c:'rgba(239,159,39,.7)'},{h:100,c:'#EF9F27'},{h:55,c:'rgba(239,159,39,.7)'},{h:20,c:'rgba(226,75,74,.5)'}],nota:'Óptimo: <strong style="color:#EF9F27">13–35 ppm</strong>',barColor:'#EF9F27'},
    {cls:'',var:'Sulfato de Hierro (FeSO₄)',val:'0.08 – 0.12 g/L',unit:'g/L · Micronutriente',bars:[{h:15,c:'rgba(226,75,74,.5)'},{h:55,c:'rgba(239,159,39,.7)'},{h:100,c:'#5DCAA5'},{h:55,c:'rgba(239,159,39,.7)'},{h:25,c:'rgba(226,75,74,.5)'}],nota:'Óptimo: <strong style="color:#5DCAA5">0.1 g/L</strong>',barColor:'#5DCAA5'},
  ],

  canvasModel: {
    row1: [
      {label:'Socios clave',en:'Key Partners',color:'#5DCAA5',items:['Universidades e institutos de investigación','Laboratorios de análisis de suelos','Asociaciones de agricultores','Proveedores de insumos biotecnológicos','ICA — Instituto Colombiano Agropecuario']},
      {label:'Actividades clave',en:'Key Activities',color:'#EF9F27',items:['Cultivo de microalgas (Método Zarrouk)','Producción del biofertilizante','Control de calidad y análisis','Análisis de fertilidad del suelo','Distribución y asesoría técnica']}
    ],
    propuesta: {label:'Propuesta de valor',en:'Value Proposition',color:'#1D9E75',cards:[
      {title:'Ambiental',text:'Biofertilizante 100% ecológico. Reduce fertilizantes sintéticos. Restaura biodiversidad del suelo.'},
      {title:'Técnico',text:'Spirulina platensis con 50–70% proteínas. Mejora pH, materia orgánica y CIC del suelo.'},
      {title:'Económico',text:'Reduce costos de fertilización 20–35%. Aumenta rendimiento del cultivo de ají.'}
    ]},
    row2: [
      {label:'Relaciones con clientes',en:'Customer Relationships',color:'#D4537E',items:['Asesoría técnica en fertilización','Capacitación sobre uso','Seguimiento del rendimiento','Soporte técnico en campo']},
      {label:'Canales',en:'Channels',color:'#7F77DD',items:['Venta directa a agricultores','Distribuidores de insumos agrícolas','Cooperativas agrícolas','Redes sociales y academia']},
      {label:'Segmentos de mercado',en:'Customer Segments',color:'#85B7EB',items:['Agricultores pequeños y medianos','Asociaciones campesinas del Caribe','Proyectos de agricultura sostenible','Viveros y productores orgánicos']}
    ],
    row3: [
      {label:'Recursos clave',en:'Key Resources',color:'#FAC775',items:['Cepa de Spirulina platensis','Biorreactor y equipos','Infraestructura de producción','Personal técnico','Conocimiento Método Zarrouk']},
      {label:'Problema técnico',en:'Technical Problem',color:'#F09595',isProblem:true,items:['Contaminación del cultivo','Control estricto de condiciones','Disponibilidad de nutrientes','Dificultad en cosecha a escala','Estabilidad del biofertilizante (≤ 15 días)']}
    ],
    row4: [
      {label:'Estructura de costos',en:'Cost Structure',color:'#F09595',items:['Producción de biomasa','Insumos de laboratorio (Zarrouk)','Equipos y mantenimiento','Transporte y distribución','I+D continuo']},
      {label:'Fuentes de ingresos',en:'Revenue Streams',color:'#9FE1CB',items:['Venta directa del biofertilizante','Servicios de asesoría agrícola','Convenios con asociaciones','Proyectos institucionales','Alianzas agroindustriales']}
    ]
  }
};
