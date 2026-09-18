import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export interface AISearchResult {
  location_intent: string | null;
  target_latitude: number | null;
  target_longitude: number | null;
  max_price: number | null;
  gender_type: "PUTRA" | "PUTRI" | "CAMPUR" | null;
  facilities_keywords: string[];
}

const COMMON_LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Jakarta & Sekitarnya (Jabodetabek)
  "monas": { lat: -6.1754, lng: 106.8272 },
  "jakarta pusat": { lat: -6.1805, lng: 106.8284 },
  "jakarta selatan": { lat: -6.2615, lng: 106.8106 },
  "jakarta timur": { lat: -6.2250, lng: 106.9004 },
  "jakarta barat": { lat: -6.1683, lng: 106.7589 },
  "jakarta utara": { lat: -6.1384, lng: 106.8640 },
  "tebet": { lat: -6.2374, lng: 106.8526 },
  "cipinang": { lat: -6.2208, lng: 106.8833 },
  "bkt": { lat: -6.2260, lng: 106.9020 },
  "bkt cipinang": { lat: -6.2260, lng: 106.9020 },
  "grogol": { lat: -6.1674, lng: 106.7881 },
  "sudirman": { lat: -6.2088, lng: 106.8227 },
  "kuningan": { lat: -6.2297, lng: 106.8295 },
  "gandaria": { lat: -6.2443, lng: 106.7835 },
  "gandaria city": { lat: -6.2443, lng: 106.7835 },
  "depok": { lat: -6.4025, lng: 106.7942 },
  "universitas indonesia": { lat: -6.3650, lng: 106.8317 },
  "ui": { lat: -6.3650, lng: 106.8317 },
  "gunadarma": { lat: -6.3688, lng: 106.8335 },
  "bekasi": { lat: -6.2383, lng: 106.9756 },
  "cikarang": { lat: -6.3039, lng: 107.1537 },
  "bogor": { lat: -6.5971, lng: 106.8060 },
  "ipb": { lat: -6.5599, lng: 106.7269 },
  "ipb dramaga": { lat: -6.5599, lng: 106.7269 },
  "cibinong": { lat: -6.4816, lng: 106.8541 },

  // Wilayah Bandung Raya & Kampus
  "bandung": { lat: -6.9175, lng: 107.6191 },
  "kota bandung": { lat: -6.9175, lng: 107.6191 },
  "kabupaten bandung": { lat: -7.0253, lng: 107.5198 },
  "bandung barat": { lat: -6.8427, lng: 107.5027 },
  "cimahi": { lat: -6.8723, lng: 107.5420 },
  "itb": { lat: -6.8915, lng: 107.6107 },
  "itb ganesha": { lat: -6.8915, lng: 107.6107 },
  "itb jatinangor": { lat: -6.9304, lng: 107.7712 },
  "unpad": { lat: -6.9263, lng: 107.7747 },
  "unpad jatinangor": { lat: -6.9263, lng: 107.7747 },
  "unpad dipatiukur": { lat: -6.8943, lng: 107.6166 },
  "jatinangor": { lat: -6.9318, lng: 107.7758 },
  "sumedang": { lat: -6.8584, lng: 107.9197 },
  "telkom university": { lat: -6.9730, lng: 107.6304 },
  "tel-u": { lat: -6.9730, lng: 107.6304 },
  "dayeuhkolot": { lat: -6.9856, lng: 107.6256 },
  "upi": { lat: -6.8604, lng: 107.5900 },
  "uin bandung": { lat: -6.9284, lng: 107.7176 },
  "unpar": { lat: -6.8741, lng: 107.6047 },
  "dago": { lat: -6.8784, lng: 107.6173 },
  "dipatiukur": { lat: -6.8943, lng: 107.6166 },
  "buah batu": { lat: -6.9538, lng: 107.6369 },

  // Kampus & Sekolah di Subang (Lokasi sudah real)
  "polsub cibogo": { lat: -6.561523371300641, lng: 107.82785901318488 },
  "polsub": { lat: -6.561523371300641, lng: 107.82785901318488 },
  "polsub kampus 2": { lat: -6.561523371300641, lng: 107.82785901318488 },
  "kampus 2 polsub": { lat: -6.561523371300641, lng: 107.82785901318488 },
  "politeknik negeri subang": { lat: -6.561523371300641, lng: 107.82785901318488 },
  "politeknik subang": { lat: -6.561523371300641, lng: 107.82785901318488 },
  "polsub kampus 1": { lat: -6.556681697229549, lng: 107.74916184228138 },
  "polsub jurusan kesehatan": { lat: -6.556681697229549, lng: 107.74916184228138 },
  "polsub jurkes": { lat: -6.556681697229549, lng: 107.74916184228138 },
  "politeknik negeri subang jurkes": { lat: -6.556681697229549, lng: 107.74916184228138 },
  "politeknik negeri subang kampus 1": { lat: -6.556681697229549, lng: 107.74916184228138 },
  "unsub": { lat: -6.577480644091338, lng: 107.7829390535246 },
  "universitas subang": { lat: -6.577480644091338, lng: 107.7829390535246 },
  "universitas subang kampus 1": { lat: -6.577480644091338, lng: 107.7829390535246 },
  "universitas subang kampus 2": { lat: -6.554064715951129, lng: 107.75965619738885 },
  "stiesa subang": { lat: -6.564563959993525, lng: 107.76616645046155 },
  "stiesa": { lat: -6.564563959993525, lng: 107.76616645046155 },
  "stie sutaatmadja": { lat: -6.564563959993525, lng: 107.76616645046155 },
  "sekolah tinggi ilmu ekonomi sutaatmadja": { lat: -6.564563959993525, lng: 107.76616645046155 },
  "stikes subang": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "universitas bhakti kencana subang": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "universitas bhakti kencana": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "bk subang": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "smk bk subang": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "smks kesehatan bhakti khencana subang": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "smks kesehatan bhakti khencana": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "bk": { lat: -6.555766165770599, lng: 107.75236753990735 },
  "universitas mandiri subang": { lat: -6.5495800760112814, lng: 107.76228223529955 },
  "stmik subang": { lat: -6.5495800760112814, lng: 107.76228223529955 },
  "stkip subang": { lat: -6.5495800760112814, lng: 107.76228223529955 },
  "akper subang": { lat: -6.556681697229549, lng: 107.74916184228138 },
  "akper pemda subang": { lat: -6.556681697229549, lng: 107.74916184228138 },
  "sman 1 subang": { lat: -6.555235982534586, lng: 107.7516253504193 },
  "sma 1 subang": { lat: -6.555235982534586, lng: 107.7516253504193 },
  "smansa subang": { lat: -6.555235982534586, lng: 107.7516253504193 },
  "sman 2 subang": { lat: -6.5469875675926605, lng: 107.73710224093026 },
  "smanda subang": { lat: -6.5469875675926605, lng: 107.73710224093026 },
  "sma 2 subang": { lat: -6.5469875675926605, lng: 107.73710224093026 },
  "smkn 1 subang": { lat: -6.55561845033699, lng: 107.75988789482295 },
  "smk 1 subang": { lat: -6.55561845033699, lng: 107.75988789482295 },
  "smea": { lat: -6.55561845033699, lng: 107.75988789482295 },
  "nesas": { lat: -6.55561845033699, lng: 107.75988789482295 },
  "smkn 2 subang": { lat: -6.546037272755595, lng: 107.73594053621991 },
  "stempert": { lat: -6.546037272755595, lng: 107.73594053621991 },
  "stempert subang": { lat: -6.546037272755595, lng: 107.73594053621991 },
  "smk 2 subang": { lat: -6.546037272755595, lng: 107.73594053621991 },
  "sman 3 subang": { lat: -6.575509613950435, lng: 107.76671764453476 },
  "sma 3 subang": { lat: -6.575509613950435, lng: 107.76671764453476 },
  "smangas": { lat: -6.575509613950435, lng: 107.76671764453476 },
  "sman 4 subang": { lat: -6.54250546795699, lng: 107.76722272365879 },
  "sma 4 subang": { lat: -6.54250546795699, lng: 107.76722272365879 },
  "smanpat": { lat: -6.54250546795699, lng: 107.76722272365879 },
  "smanpat subang": { lat: -6.54250546795699, lng: 107.76722272365879 },
  "man 1 subang": { lat: -6.554768639204686, lng: 107.75896648053225 },
  "smas bina putera subang": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "smks bina putera subang": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "sma bina putera subang": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "smk bina putera subang": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "sma bp subang": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "smk bp subang": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "sma bp": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "smk bp": { lat: -6.553628166595311, lng: 107.75524458504113 },
  "smas muhammadiyah subang": { lat: -6.559576781453508, lng: 107.75953040904469 },
  "sma muhammadiyah subang": { lat: -6.559576781453508, lng: 107.75953040904469 },
  "sma muhammadiyah": { lat: -6.559576781453508, lng: 107.75953040904469 },
  "smas pgri 1 subang": { lat: -6.563129501071218, lng: 107.767075345709 },
  "sma pgri 1 subang": { lat: -6.563129501071218, lng: 107.767075345709 },
  "smakot": { lat: -6.563129501071218, lng: 107.767075345709 },
  "smas pgri 2 subang": { lat: -6.554706731609134, lng: 107.76031315372302 },
  "sma pgri 2 subang": { lat: -6.554706731609134, lng: 107.76031315372302 },
  "sma petang": { lat: -6.554706731609134, lng: 107.76031315372302 },
  "smk integral prof dr. hamka subang": { lat: -6.337663771190273, lng: 107.66857062180522 },
  "smk kesenian subang": { lat: -6.553670763326592, lng: 107.75875232410662 },
  "smk kesenian": { lat: -6.553670763326592, lng: 107.75875232410662 },
  "smk pgri subang": { lat: -6.54913591202024, lng: 107.76157725174497 },
  "smk pgri": { lat: -6.54913591202024, lng: 107.76157725174497 },
  "smeri": { lat: -6.54913591202024, lng: 107.76157725174497 },
  "tubun": { lat: -6.54913591202024, lng: 107.76157725174497 },
  "smk tubun": { lat: -6.54913591202024, lng: 107.76157725174497 },
  "smk tubun subang": { lat: -6.54913591202024, lng: 107.76157725174497 },
  "smk bina mandiri subang": { lat: -6.544409049054475, lng: 107.76662129482285 },
  "smks bina mandiri subang": { lat: -6.544409049054475, lng: 107.76662129482285 },
  "smk bina teknologi subang": { lat: -6.5559405613016075, lng: 107.7516677473583 },
  "smk bina teknologi": { lat: -6.5559405613016075, lng: 107.7516677473583 },
  "smk bintek": { lat: -6.5559405613016075, lng: 107.7516677473583 },
  "bintek": { lat: -6.5559405613016075, lng: 107.7516677473583 },
  "smks pasundan subang": { lat: -6.552962994857143, lng: 107.76095252180733 },
  "smk pasundan subang": { lat: -6.552962994857143, lng: 107.76095252180733 },
  "smk terpadu lampang": { lat: -6.5932270622649005, lng: 107.72637343901307 },
  "smks terpadu lampang": { lat: -6.5932270622649005, lng: 107.72637343901307 },
  "smk ypib subang": { lat: -6.544144755524339, lng: 107.76611804930965 },
  "smks ypib subang": { lat: -6.544144755524339, lng: 107.76611804930965 },
  "smk ypib": { lat: -6.544144755524339, lng: 107.76611804930965 },
  "ma al-ishlah sagalaherang": { lat: -6.675439368774282, lng: 107.65263473055344 },
  "sma terpadu rahmatika sagalaherang": { lat: -6.668460937070895, lng: 107.6405622255115 },
  "sma terpadu rahmatika": { lat: -6.668460937070895, lng: 107.6405622255115 },
  "smk it adzikri": { lat: -6.689026939758257, lng: 107.63605804098005 },
  "smks ghoniyul ulum sagalaherang": { lat: -6.62474639922612, lng: 107.67388104229481 },
  "smk ghoniyul ulum sagalaherang": { lat: -6.62474639922612, lng: 107.67388104229481 },
  "smks nurul huda sagalaherang": { lat: -6.679708047905675, lng: 107.65061254229481 },
  "smk nurul huda sagalaherang": { lat: -6.679708047905675, lng: 107.65061254229481 },
  "smks sagalaherang": { lat: -6.670919215099222, lng: 107.65176845385224 },
  "smk sagalaherang": { lat: -6.670919215099222, lng: 107.65176845385224 },
  "politeknik agroindustri": { lat: -6.337034038253997, lng: 107.66467518317992 },
  "steinu subang": { lat: -6.5235383985145035, lng: 107.67550324987064 },
  "sekolah tinggi ekonomi islam nahdlatul ulama subang": { lat: -6.5235383985145035, lng: 107.67550324987064 },
  "stie miftahul huda subang": { lat: -6.30651836287209, lng: 107.81801661016405 },
  "sekolah tinggi ilmu ekonomi miftahul huda subang": { lat: -6.30651836287209, lng: 107.81801661016405 },
  "sekolah tinggi teknologi texmaco": { lat: -6.466967045180068, lng: 107.57340045040809 },
  "stt texmaco": { lat: -6.466967045180068, lng: 107.57340045040809 },
  "institut miftahul huda subang": { lat: -6.305564795513472, lng: 107.81814818132816 },
  "stai miftahul huda pamanukan subang": { lat: -6.305564795513472, lng: 107.81814818132816 },
  "stei al-amar subang": { lat: -6.5509602132309555, lng: 107.77678419798822 },
  "stei al-amar subang jawa barat": { lat: -6.5509602132309555, lng: 107.77678419798822 },

  // Rumah Sakit & Fasilitas Kesehatan Subang (lokasi sudah real)
  "rsud subang": { lat: -6.557198037841325, lng: 107.74733504469 },
  "rsud kabupaten subang": { lat: -6.557198037841325, lng: 107.74733504469 },
  "rsud ciereng": { lat: -6.557198037841325, lng: 107.74733504469 },
  "rsud ciawi subang": { lat: -6.557198037841325, lng: 107.74733504469 },
  "rs hamori": { lat: -6.527419929926607, lng: 107.79129932365858 },
  "rs hamori subang": { lat: -6.527419929926607, lng: 107.79129932365858 },
  "rs mutiara hati": { lat: -6.472291529841256, lng: 107.81098820070372 },
  "rs mutiara hati subang": { lat: -6.472291529841256, lng: 107.81098820070372 },
  "rs pmi subang": { lat: -6.554918634737961, lng: 107.7625426917797 },
  "klinik pmi subang": { lat: -6.554918634737961, lng: 107.7625426917797 },
  "rs lanud suryadarma": { lat: -6.51332533000529, lng: 107.66350627802758 },
  "rsaau dr hoediyono": { lat: -6.51332533000529, lng: 107.66350627802758 },
  "rs karisma pamanukan": { lat: -6.3126616062865475, lng: 107.81945394966792 },
  "rs mitra plumbon subang": { lat: -6.54299833754761, lng: 107.77984010831516 },
  "rs mitra plumbon": { lat: -6.54299833754761, lng: 107.77984010831516 },
  "rs ptpn viii subang": { lat: -6.567988358736004, lng: 107.76270922367344 },
  "rs ptpn subang": { lat: -6.567988358736004, lng: 107.76270922367344 },
  "rs ppn subang": { lat: -6.567988358736004, lng: 107.76270922367344 },
  "rsia grha mutiara": { lat: -6.560495597377719, lng: 107.74906938203983 },
  "rs ibu dan anak grha mutiara": { lat: -6.560495597377719, lng: 107.74906938203983 },
  "rs rayhan hospital": { lat: -6.494709233714954, lng: 107.5970691236582 },
  "rs hosana indosehat 2003": { lat: -6.501970937161103, lng: 107.58039434085352 },

  // Pabrik & Kawasan Industri di Subang (lokasi sudah real)
  "taekwang subang": { lat: -6.559492552652902, lng: 107.78749917681878 },
  "pt taekwang": { lat: -6.559492552652902, lng: 107.78749917681878 },
  "pt taekwang indonesia": { lat: -6.559492552652902, lng: 107.78749917681878 },
  "taekwang": { lat: -6.559492552652902, lng: 107.78749917681878 },
  "dahana subang": { lat: -6.56990122491958, lng: 107.84184456599361 },
  "pt dahana": { lat: -6.56990122491958, lng: 107.84184456599361 },
  "kawasan dahana": { lat: -6.56990122491958, lng: 107.84184456599361 },
  "dahana": { lat: -6.56990122491958, lng: 107.84184456599361 },
  "handsome subang": { lat: -6.47876019649225, lng: 107.68487111182088 },
  "pt handsome": { lat: -6.47876019649225, lng: 107.68487111182088 },
  "daenong subang": { lat: -6.535912970484043, lng: 107.69283505249463 },
  "pt daenong": { lat: -6.535912970484043, lng: 107.69283505249463 },
  "pt daenong global": { lat: -6.535912970484043, lng: 107.69283505249463 },
  "daenong": { lat: -6.535912970484043, lng: 107.69283505249463 },
  "pungkook subang": { lat: -6.38780942446708, lng: 107.59662231251986 },
  "pt pungkook": { lat: -6.38780942446708, lng: 107.59662231251986 },
  "pt pungkook indonesia": { lat: -6.38780942446708, lng: 107.59662231251986 },
  "pungkook": { lat: -6.38780942446708, lng: 107.59662231251986 },
  "pirelli subang": { lat: -6.48872773027722, lng: 107.67874999669576 },
  "pt evoluzione": { lat: -6.48872773027722, lng: 107.67874999669576 },
  "pt evoluzione tyres": { lat: -6.48872773027722, lng: 107.67874999669576 },
  "evoluzione tyres": { lat: -6.48872773027722, lng: 107.67874999669576 },
  "subang smartpolitan": { lat: -6.47127882293114, lng: 107.60457625659589 },
  "suryacipta subang": { lat: -6.47127882293114, lng: 107.60457625659589 },
  "kawasan industri subang": { lat: -6.47127882293114, lng: 107.60457625659589 },
  "pt suai": { lat: -6.507060819994228, lng: 107.60747807947878 },
  "suai subang": { lat: -6.507060819994228, lng: 107.60747807947878 },
  "pt subang autocomp indonesia": { lat: -6.507060819994228, lng: 107.60747807947878 },
  "pt buma": { lat: -6.4919497712131005, lng: 107.67624765108023 },
  "buma apparel": { lat: -6.4919497712131005, lng: 107.67624765108023 },
  "pt taifa": { lat: -6.515353687386832, lng: 107.80019202593652 },
  "taifa": { lat: -6.515353687386832, lng: 107.80019202593652 },
  "pt sungwon": { lat: -6.509371843889878, lng: 107.67625221183819 },
  "pt sungwon indojaya": { lat: -6.509371843889878, lng: 107.67625221183819 },
  "sungwon": { lat: -6.509371843889878, lng: 107.67625221183819 },
  "pt vinfast automobile indonesia": { lat: -6.540894619550436, lng: 107.83463583578835 },
  "pt vinfast": { lat: -6.540894619550436, lng: 107.83463583578835 },
  "vinfast": { lat: -6.540894619550436, lng: 107.83463583578835 },
  "pt byd auto indonesia": { lat: -6.453184707400831, lng: 107.61050532065451 },
  "pt byd": { lat: -6.453184707400831, lng: 107.61050532065451 },
  "byd": { lat: -6.453184707400831, lng: 107.61050532065451 },
  "pt youme indonesia": { lat: -6.555723529976484, lng: 107.82676752614262 },
  "youme subang": { lat: -6.555723529976484, lng: 107.82676752614262 },
  "youme": { lat: -6.555723529976484, lng: 107.82676752614262 },
  "pt youme": { lat: -6.555723529976484, lng: 107.82676752614262 },

  // Transportasi & Landmark Subang (lokasi sudah real)
  "alun-alun subang": { lat: -6.570973401391386, lng: 107.76152995064353 },
  "subang kota": { lat: -6.5622630394934225, lng: 107.76807961817927 },
  "wisma karya": { lat: -6.57128531592665, lng: 107.75937125587826 },
  "wisma karya subang": { lat: -6.57128531592665, lng: 107.75937125587826 },
  "gerbang tol subang": { lat: -6.531702123935924, lng: 107.78369521045482 },
  "exit tol subang": { lat: -6.531702123935924, lng: 107.78369521045482 },
  "pintu tol subang": { lat: -6.531702123935924, lng: 107.78369521045482 },
  "gerbang tol kalijati": { lat: -6.50896592092235, lng: 107.67871525278399 },
  "exit tol kalijati": { lat: -6.50896592092235, lng: 107.67871525278399 },
  "gerbang tol cipeundeuy": { lat: -6.469219947578198, lng: 107.59834386532278 },
  "exit tol cipeundeuy": { lat: -6.469219947578198, lng: 107.59834386532278 },
  "terminal subang": { lat: -6.549973356197184, lng: 107.76927673721426 },
  "terminal tipe a subang": { lat: -6.549973356197184, lng: 107.76927673721426 },
  "stasiun pagaden baru": { lat: -6.453399189723545, lng: 107.81725507579559 },
  "stasiun pagaden": { lat: -6.453399189723545, lng: 107.81725507579559 },
  "stasiun pegaden baru": { lat: -6.453399189723545, lng: 107.81725507579559 },
  "stasiun pabuaran": { lat: -6.409187451535473, lng: 107.5841607393785 },
  "stasiun pasirbungur": { lat: -6.426401823155731, lng: 107.68873823725542 },
  "stasiun cikaum": { lat: -6.435545328910344, lng: 107.73962279864453 },
  "sari ater": { lat: -6.737879550864817, lng: 107.65667158376623 },
  "ciater hot spring": { lat: -6.737879550864817, lng: 107.65667158376623 },
  "tangkuban perahu": { lat: -6.759163052398949, lng: 107.60994184832886 },
  "d'castello": { lat: -6.724504792747198, lng: 107.65637855093863 },
  "florawisata d'castello": { lat: -6.724504792747198, lng: 107.65637855093863 },
  "dcastello": { lat: -6.724504792747198, lng: 107.65637855093863 },

  // Wilayah Subang Kecamatan & Area (lokasi sudah real)
  "kalijati": { lat: -6.508534595378571, lng: 107.67652616755514 },
  "pagaden barat": { lat: -6.464244359266367, lng: 107.76245616183661 },
  "pagaden": { lat: -6.446697600431956, lng: 107.81279518233012 },
  "pamanukan": { lat: -6.282433787928448, lng: 107.82201284768567 },
  "jalancagak": { lat: -6.672759270111543, lng: 107.69852496646456 },
  "ciater": { lat: -6.735844686672168, lng: 107.64595924957155 },
  "cipeundeuy": { lat: -6.739563752483975, lng: 107.36181175980468 },
  "dawuan": { lat: -6.540888099430437, lng: 107.72031101240438 },
  "purwadadi": { lat: -6.449453293416632, lng: 107.68575135767256 },
  "cibogo": { lat: -6.5580816503890125, lng: 107.79927364917693 },
  "ciasem": { lat: -6.348702081896644, lng: 107.65919776124284 },
  "blanakan": { lat: -6.276856124290939, lng: 107.65887717589446 },
  "pelabuhan patimban": { lat: -6.243996971837687, lng: 107.90407126430124 },
  "patimban": { lat: -6.219993388407371, lng: 107.87495124103107 },
  "tanjungsiang": { lat: -6.751838464947252, lng: 107.80931221045444 },
  "kasomalang": { lat: -6.698172064763346, lng: 107.73625736798857 },
  "sagalaherang": { lat: -6.681185140032922, lng: 107.6525937136638 },
  "serangpanjang": { lat: -6.665512948305298, lng: 107.62730081844693 },
  "subang": { lat: -6.5622630394934225, lng: 107.76807961817927 },

  // Wilayah Jawa Barat Lainnya (Kota & Kabupaten)
  "sukabumi": { lat: -6.9277, lng: 106.9298 },
  "cianjur": { lat: -6.8173, lng: 107.1396 },
  "karawang": { lat: -6.3042, lng: 107.3075 },
  "unsika": { lat: -6.3263, lng: 107.3041 },
  "purwakarta": { lat: -6.5569, lng: 107.4431 },
  "cirebon": { lat: -6.7320, lng: 108.5523 },
  "ugj cirebon": { lat: -6.7092, lng: 108.5472 },
  "indramayu": { lat: -6.3275, lng: 108.3200 },
  "majalengka": { lat: -6.8361, lng: 108.2274 },
  "kuningan jabar": { lat: -6.9764, lng: 108.4839 },
  "garut": { lat: -7.2274, lng: 107.9087 },
  "tasikmalaya": { lat: -7.3274, lng: 108.2207 },
  "unsil": { lat: -7.3486, lng: 108.2144 },
  "ciamis": { lat: -7.3258, lng: 108.3533 },
  "banjar": { lat: -7.3685, lng: 108.5327 },
  "pangandaran": { lat: -7.7028, lng: 108.4947 },

  // Kampus & Kota Populer Nasional (Jawa & Lainnya)
  "ugm": { lat: -7.7713, lng: 110.3778 },
  "universitas gadjah mada": { lat: -7.7713, lng: 110.3778 },
  "yogyakarta": { lat: -7.7956, lng: 110.3695 },
  "jogja": { lat: -7.7956, lng: 110.3695 },
  "undip": { lat: -7.0506, lng: 110.4385 },
  "semarang": { lat: -6.9667, lng: 110.4167 },
  "unair": { lat: -7.2683, lng: 112.7844 },
  "its": { lat: -7.2797, lng: 112.7975 },
  "surabaya": { lat: -7.2575, lng: 112.7521 },
  "ub": { lat: -7.9526, lng: 112.6144 },
  "malang": { lat: -7.9666, lng: 112.6326 },
};

function findCoordinateInDictionary(locationName: string): { lat: number; lng: number } | null {
  const locLower = locationName.toLowerCase().trim();

  // Sort keys by descending length so "polsub" or "taekwang subang" matches before "subang"
  const sortedKeys = Object.keys(COMMON_LOCATION_COORDINATES).sort(
    (a, b) => b.length - a.length
  );

  for (const key of sortedKeys) {
    const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const wordBoundaryRegex = new RegExp(`(^|\\s|\\b)${escaped}(\\b|\\s|$)`, "i");
    if (wordBoundaryRegex.test(locLower) || locLower === key || locLower.includes(key)) {
      return COMMON_LOCATION_COORDINATES[key];
    }
  }
  return null;
}

async function fetchOnlineGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query + ", Indonesia"
      )}&format=json&limit=1&countrycodes=id`,
      {
        headers: {
          "User-Agent": "Kospasti-AI-App/1.0",
          "Accept-Language": "id",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { lat, lng: lon };
        }
      }
    }
  } catch {
    // Abaikan jika timeout atau offline
  }
  return null;
}

function fallbackExtractCriteria(prompt: string): AISearchResult {
  const lower = prompt.toLowerCase();

  // 1. Gender extraction
  let gender_type: "PUTRA" | "PUTRI" | "CAMPUR" | null = null;
  if (/\b(putri|cewek|wanita|perempuan)\b/i.test(lower)) {
    gender_type = "PUTRI";
  } else if (/\b(putra|cowok|pria|laki)\b/i.test(lower)) {
    gender_type = "PUTRA";
  } else if (/\b(campur|pasutri)\b/i.test(lower)) {
    gender_type = "CAMPUR";
  }

  // 2. Price extraction
  let max_price: number | null = null;
  const jtMatch = lower.match(
    /(?:di\s*bawah|maks(?:imal)?|budget|<|<=)?\s*(\d+(?:[.,]\d+)?)\s*(?:juta|jt)/i
  );
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(",", "."));
    if (!isNaN(num)) max_price = Math.round(num * 1000000);
  } else {
    const rbMatch = lower.match(
      /(?:di\s*bawah|maks(?:imal)?|budget|<|<=)?\s*(\d+(?:[.,]\d+)?)\s*(?:ribu|rb|k)/i
    );
    if (rbMatch) {
      const num = parseFloat(rbMatch[1].replace(",", "."));
      if (!isNaN(num)) max_price = Math.round(num * 1000);
    } else {
      const exactMatch = lower.match(/(\d{6,8})/);
      if (exactMatch) {
        max_price = parseInt(exactMatch[1], 10);
      }
    }
  }

  // 3. Facilities keywords
  const facilities_keywords: string[] = [];
  if (/\bac\b/i.test(lower)) facilities_keywords.push("AC");
  if (/\b(wifi|wi-fi|internet)\b/i.test(lower)) facilities_keywords.push("WiFi");
  if (/\b(km\s*dalam|kamar\s*mandi\s*dalam)\b/i.test(lower))
    facilities_keywords.push("Kamar Mandi Dalam");
  if (/\b(parkir|parkiran|garasi)\b/i.test(lower)) facilities_keywords.push("Parkir");
  if (/\b(kasur|springbed|bed)\b/i.test(lower)) facilities_keywords.push("Kasur");
  if (/\b(lemari)\b/i.test(lower)) facilities_keywords.push("Lemari");
  if (/\b(dapur)\b/i.test(lower)) facilities_keywords.push("Dapur");
  if (/\b(water\s*heater)\b/i.test(lower)) facilities_keywords.push("Water Heater");

  // 4. Location extraction
  let location_intent: string | null = null;
  let target_latitude: number | null = null;
  let target_longitude: number | null = null;

  const locMatch = lower.match(
    /(?:dekat|deket|sekitar|area|daerah|di)\s+([a-z0-9\s.]+?)(?=\s+(?:harga|fasilitas|ada|khusus|budget|maks|di\s*bawah|putra|putri|campur|\d|$))/i
  );
  if (locMatch && locMatch[1].trim().length > 1) {
    location_intent = locMatch[1].trim();
    const dictCoord = findCoordinateInDictionary(location_intent);
    if (dictCoord) {
      target_latitude = dictCoord.lat;
      target_longitude = dictCoord.lng;
    }
  }

  return {
    location_intent,
    target_latitude,
    target_longitude,
    max_price,
    gender_type,
    facilities_keywords,
  };
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt pencarian tidak boleh kosong." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY belum dikonfigurasi pada server.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Anda adalah asisten AI cerdas untuk aplikasi pencarian kos "Kospasti".
Tugas Anda adalah mengekstrak informasi dan kriteria pencarian kos dari teks input pengguna (bahasa sehari-hari / natural language) ke dalam format JSON yang terstruktur beserta estimasi koordinat Latitude & Longitude lokasi target di Indonesia jika disebutkan.

Aturan Ekstraksi:
1. location_intent: Nama daerah, nama tempat, nama universitas, nama kantor, landmark, atau area spesifik yang dituju (misal: "Universitas Indonesia", "Polsub", "Unsub", "PT Taekwang Subang", "Monas", "Grogol", "BKT Cipinang", "UGM"). Jika tidak disebutkan lokasi tujuan, kembalikan null.
2. target_latitude: Estimasi angka Latitude geografis lokasi target tersebut di Indonesia. Jika tidak ada lokasi tujuan, kembalikan null.
3. target_longitude: Estimasi angka Longitude geografis lokasi target tersebut di Indonesia. Jika tidak ada lokasi tujuan, kembalikan null.
4. max_price: Angka batas maksimal harga sewa per bulan dalam Rupiah (number/integer). Contoh: "di bawah 2 juta" -> 2000000, "maksimal 1.5 jt" -> 1500000, "budget 800rb" -> 800000. Jika tidak disebutkan batas harga, kembalikan null.
5. gender_type: Jenis kelamin/tipe kos. Hanya boleh salah satu dari: "PUTRA", "PUTRI", "CAMPUR", atau null jika tidak spesifik.
6. facilities_keywords: Array kata kunci fasilitas yang diinginkan (contoh: ["AC", "WiFi", "Kamar Mandi Dalam", "Parkir Mobil"]). Jika tidak ada fasilitas spesifik yang dicari, kembalikan array kosong [].`;

    const generateConfig = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          location_intent: {
            type: Type.STRING,
            description: "Nama tempat/daerah/kampus tujuan atau null jika tidak ada",
            nullable: true,
          },
          target_latitude: {
            type: Type.NUMBER,
            description: "Estimasi latitude lokasi tujuan di Indonesia atau null",
            nullable: true,
          },
          target_longitude: {
            type: Type.NUMBER,
            description: "Estimasi longitude lokasi tujuan di Indonesia atau null",
            nullable: true,
          },
          max_price: {
            type: Type.NUMBER,
            description: "Batas maksimal harga per bulan (dalam Rupiah) atau null",
            nullable: true,
          },
          gender_type: {
            type: Type.STRING,
            description: "Jenis kelamin/tipe kos ('PUTRA', 'PUTRI', 'CAMPUR', atau null)",
            nullable: true,
          },
          facilities_keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Daftar kata kunci fasilitas yang dicari",
          },
        },
        required: ["facilities_keywords"],
      },
    };

    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
    ];

    let outputText: string | null = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: generateConfig,
        });
        if (response.text) {
          outputText = response.text;
          break;
        }
      } catch {
        console.warn(`Model ${modelName} failed or busy, trying next model...`);
      }
    }

    let parsedData: AISearchResult;

    if (outputText) {
      parsedData = JSON.parse(outputText);
    } else {
      console.warn("Semua model Gemini sedang sibuk (503/error), menggunakan fallback regex parser.");
      parsedData = fallbackExtractCriteria(prompt);
    }

    // Resolusi koordinat cerdas:
    // 1. Cek kamus spesifik berbasis Longest-Match
    if (parsedData.location_intent) {
      const dictCoord = findCoordinateInDictionary(parsedData.location_intent);
      if (dictCoord) {
        parsedData.target_latitude = dictCoord.lat;
        parsedData.target_longitude = dictCoord.lng;
      } else if (!parsedData.target_latitude || !parsedData.target_longitude) {
        // 2. Jika tidak ada di kamus dan AI belum memberikan koordinat, gunakan geocoding OpenStreetMap otomatis
        const osmCoord = await fetchOnlineGeocode(parsedData.location_intent);
        if (osmCoord) {
          parsedData.target_latitude = osmCoord.lat;
          parsedData.target_longitude = osmCoord.lng;
        }
      }
    }

    // Normalisasi gender_type jika di luar nilai yang diizinkan
    if (
      parsedData.gender_type &&
      !["PUTRA", "PUTRI", "CAMPUR"].includes(parsedData.gender_type.toUpperCase())
    ) {
      parsedData.gender_type = null;
    } else if (parsedData.gender_type) {
      parsedData.gender_type = parsedData.gender_type.toUpperCase() as
        | "PUTRA"
        | "PUTRI"
        | "CAMPUR";
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: unknown) {
    try {
      const { prompt } = await req.clone().json();
      if (typeof prompt === "string" && prompt.trim()) {
        const fallback = fallbackExtractCriteria(prompt);
        return NextResponse.json({
          success: true,
          data: fallback,
        });
      }
    } catch {
      // ignore
    }

    const message = error instanceof Error ? error.message : "Gagal memproses pencarian AI.";
    console.error("AI Search API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
