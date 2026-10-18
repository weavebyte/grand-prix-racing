// Names: Formula1.com 2026 team roster, checked 2026-10-18.
// All ratings are fictional arcade balancing values, not real-world rankings.
const driver=(name,number,pace,control,wet,tyre)=>({name,number,stats:{pace,control,wet,tyre}});
const team=(id,name,color,tag,speed,accel,corner,brake,drivers)=>({id,name,color,tag,stats:{speed,accel,corner,brake},drivers});
export const TEAMS=[
 team('mclaren','맥라렌','#ff921c','코너를 빠르게',90,88,97,89,[driver('랜도 노리스',4,94,92,88,86),driver('오스카 피아스트리',81,91,95,83,94)]),
 team('ferrari','페라리','#e94343','직선 최고 속도',98,91,84,87,[driver('샤를 르클레르',16,98,86,83,85),driver('루이스 해밀턴',44,91,90,97,94)]),
 team('mercedes','메르세데스','#45d8c3','강한 제동 성능',88,90,90,98,[driver('조지 러셀',63,93,95,89,90),driver('키미 안토넬리',12,97,83,92,82)]),
 team('redbull','레드불','#7085ff','빠른 가속',94,98,88,82,[driver('막스 베르스타펜',3,98,90,96,85),driver('이삭 하자르',6,91,94,84,93)]),
 team('aston','애스턴 마틴','#288e73','안정적인 코너',83,84,96,95,[driver('페르난도 알론소',14,89,98,93,97),driver('랜스 스트롤',18,94,85,96,86)]),
 team('williams','윌리엄스','#4e9cfc','직선과 가속',96,93,80,88,[driver('카를로스 사인츠',55,90,94,86,98),driver('알렉산더 알본',23,96,89,94,88)]),
 team('alpine','알핀','#ef99d0','민첩한 방향 전환',85,93,94,84,[driver('피에르 가슬리',10,93,91,94,87),driver('프랑코 콜라핀토',43,96,86,85,95)]),
 team('haas','하스','#e5e7df','제동과 직선',92,84,86,96,[driver('에스테반 오콘',31,89,96,93,91),driver('올리버 베어먼',87,97,87,85,90)]),
 team('racingbulls','레이싱 불스','#acb9ff','가볍고 민첩하게',84,96,93,85,[driver('리암 로슨',30,92,95,91,87),driver('아비드 린드블라드',41,98,83,85,95)]),
 team('audi','아우디','#ff704e','균형 잡힌 차',91,89,89,91,[driver('니코 휠켄베르크',27,90,97,91,93),driver('가브리엘 보르톨레토',5,96,86,92,88)]),
 team('cadillac','캐딜락','#c8c7ad','안정성과 제동',84,87,94,94,[driver('세르히오 페레스',11,91,91,88,99),driver('발테리 보타스',77,96,95,85,87)])
];
export const CIRCUITS=[
 {id:'monaco',name:'모나코',flag:'🇲🇨',subtitle:'항구 시가지',tag:'좁은 길 · 헤어핀',theme:'harbor',width:12,length:1900,sky:0x91cbe1,ground:0x81a977,points:[[0,0],[0,-130],[35,-200],[145,-220],[200,-170],[120,-120],[175,-60],[230,20],[190,130],[95,165],[10,140],[-45,70]],rain:.8},
 {id:'italy',name:'이탈리아',flag:'🇮🇹',subtitle:'숲속 고속 서킷',tag:'긴 직선 · 시케인',theme:'forest',width:17,length:2800,sky:0xa7d7e8,ground:0x6f9c52,points:[[0,0],[0,-220],[14,-250],[-8,-280],[0,-360],[110,-410],[220,-330],[250,-100],[215,-65],[245,-25],[240,160],[130,230],[5,180]],rain:.45},
 {id:'japan',name:'일본',flag:'🇯🇵',subtitle:'벚꽃 테크니컬',tag:'연속 S 코너 · 고저차',theme:'sakura',width:15,length:2300,sky:0xb8d4ed,ground:0x86ac66,points:[[0,0],[0,-150],[60,-230],[115,-175],[160,-235],[220,-175],[245,-80],[165,-25],[220,90],[145,200],[30,200],[-60,100]],rain:.9},
 {id:'britain',name:'영국',flag:'🇬🇧',subtitle:'초원 그랑프리',tag:'넓은 길 · 고속 코너',theme:'meadow',width:19,length:2600,sky:0xb7ccdf,ground:0x6d985e,points:[[0,0],[0,-220],[100,-280],[220,-245],[260,-160],[180,-105],[270,-20],[235,100],[110,125],[65,225],[-70,190],[-115,70]],rain:1},
 {id:'singapore',name:'싱가포르',flag:'🇸🇬',subtitle:'네온 나이트 레이스',tag:'야경 · 직각 코너',theme:'night',width:13,length:2100,sky:0x15213b,ground:0x384950,points:[[0,0],[0,-180],[90,-210],[110,-100],[210,-100],[235,10],[150,40],[190,150],[70,200],[-40,180],[-70,100],[-25,65]],rain:1}
];
CIRCUITS.push({id:'korea',name:'대한민국',flag:'🇰🇷',subtitle:'한빛 시티 서킷',tag:'긴 직선 · 산과 도심 · 급커브',theme:'korea',width:16,length:2450,sky:0xa9cce6,ground:0x6e8d67,illustration:true,points:[[0,0],[0,-260],[90,-280],[180,-200],[115,-150],[225,-80],[245,70],[160,110],[200,200],[70,230],[-55,150],[-100,50],[-35,-20]],rain:.65});
export const TEAM_STATS=[['speed','최고속도'],['accel','가속'],['corner','코너링'],['brake','제동']];
export const DRIVER_STATS=[['pace','스피드'],['control','차량 제어'],['wet','빗길'],['tyre','타이어 관리']];

// Local copies of the official driver portraits; source URLs in assets/sources.json.
const PHOTO_IDS=[['lando-norris','oscar-piastri'],['charles-leclerc','lewis-hamilton'],['george-russell','kimi-antonelli'],['max-verstappen','isack-hadjar'],['fernando-alonso','lance-stroll'],['carlos-sainz','alexander-albon'],['pierre-gasly','franco-colapinto'],['esteban-ocon','oliver-bearman'],['liam-lawson','arvid-lindblad'],['nico-hulkenberg','gabriel-bortoleto'],['sergio-perez','valtteri-bottas']];
TEAMS.forEach((t,i)=>t.drivers.forEach((d,j)=>{d.photo=`assets/drivers/${PHOTO_IDS[i][j]}.webp`;}));
