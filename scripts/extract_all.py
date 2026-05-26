import fitz
import json
import os

PDF_PATH = os.path.join(os.path.dirname(__file__), '..', 'DK中英双语10000词.pdf')
IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'assets', 'images')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'app', 'data')

TOPICS = [
    # (id, title, titleEn, category, category_color, start_page)
    ("01", "身体各部分", "The Body", "人", "#8B5CF6", 12),
    ("02", "手和脚", "Hands and Feet", "人", "#8B5CF6", 14),
    ("03", "肌肉和骨骼", "Muscles and Skeleton", "人", "#8B5CF6", 16),
    ("04", "内部器官", "Internal Organs", "人", "#8B5CF6", 18),
    ("05", "家庭", "Family", "人", "#8B5CF6", 20),
    ("06", "感觉和情绪", "Feelings and Emotions", "人", "#8B5CF6", 22),
    ("07", "人生大事", "Life Events", "人", "#8B5CF6", 24),
    ("08", "怀孕和童年", "Pregnancy and Childhood", "人", "#8B5CF6", 26),
    ("09", "日常生活", "Daily Life", "人", "#8B5CF6", 28),
    ("10", "性格特征", "Personality", "人", "#8B5CF6", 30),
    ("11", "能力和行为", "Abilities and Behavior", "人", "#8B5CF6", 32),
    ("12", "外貌和头发", "Appearance and Hair", "外貌", "#D946EF", 34),
    ("13", "衣服1", "Clothes 1", "外貌", "#D946EF", 36),
    ("14", "衣服2", "Clothes 2", "外貌", "#D946EF", 38),
    ("15", "衣服3", "Clothes 3", "外貌", "#D946EF", 40),
    ("16", "装饰品", "Accessories", "外貌", "#D946EF", 42),
    ("17", "鞋类", "Shoes", "外貌", "#D946EF", 44),
    ("18", "美容", "Beauty", "外貌", "#D946EF", 46),
    ("19", "疾病和损伤", "Illness and Injury", "健康", "#EF4444", 48),
    ("20", "看医生", "Doctor", "健康", "#EF4444", 50),
    ("21", "医院", "Hospital", "健康", "#EF4444", 52),
    ("22", "牙医和配镜师", "Dentist and Optician", "健康", "#EF4444", 54),
    ("23", "饮食和营养", "Diet and Nutrition", "健康", "#EF4444", 56),
    ("24", "身心健康", "Mental and Physical Health", "健康", "#EF4444", 58),
    ("25", "生活场景", "Living Scenes", "家", "#F97316", 60),
    ("26", "起居室和餐厅", "Living Room and Dining Room", "家", "#F97316", 62),
    ("27", "厨房和餐具", "Kitchen and Tableware", "家", "#F97316", 64),
    ("28", "厨具", "Kitchenware", "家", "#F97316", 66),
    ("29", "烹饪", "Cooking", "家", "#F97316", 68),
    ("30", "卧室", "Bedroom", "家", "#F97316", 70),
    ("31", "浴室", "Bathroom", "家", "#F97316", 72),
    ("32", "房子和家", "House and Home", "家", "#F97316", 74),
    ("33", "电力装置和管道", "Electrical and Plumbing", "家", "#F97316", 76),
    ("34", "家务活", "Housework", "家", "#F97316", 78),
    ("35", "家庭装修", "Home Renovation", "家", "#F97316", 80),
    ("36", "工具", "Tools", "家", "#F97316", 82),
    ("37", "装饰", "Decoration", "家", "#F97316", 84),
    ("38", "花园植物和室内植物", "Garden and Indoor Plants", "家", "#F97316", 86),
    ("39", "实用园艺", "Practical Gardening", "家", "#F97316", 88),
    ("40", "园艺工具", "Gardening Tools", "家", "#F97316", 90),
    ("41", "花园特征", "Garden Features", "家", "#F97316", 92),
    ("42", "城镇1", "Town 1", "城市生活", "#10B981", 94),
    ("43", "城镇2", "Town 2", "城市生活", "#10B981", 96),
    ("44", "建筑", "Architecture", "城市生活", "#10B981", 98),
    ("45", "银行和邮局", "Bank and Post Office", "城市生活", "#10B981", 100),
    ("46", "购物", "Shopping", "城市生活", "#10B981", 102),
    ("47", "商城", "Shopping Mall", "城市生活", "#10B981", 104),
    ("48", "超市", "Supermarket", "城市生活", "#10B981", 106),
    ("49", "药店", "Pharmacy", "城市生活", "#10B981", 108),
    ("50", "应急服务", "Emergency Services", "城市生活", "#10B981", 110),
    ("51", "能源供给", "Energy Supply", "城市生活", "#10B981", 112),
    ("52", "饮食", "Food and Drink", "食物", "#EF4444", 114),
    ("53", "肉类", "Meat", "食物", "#EF4444", 116),
    ("54", "鱼类和海产品", "Fish and Seafood", "食物", "#EF4444", 118),
    ("55", "蔬菜1", "Vegetables 1", "食物", "#EF4444", 120),
    ("56", "蔬菜2", "Vegetables 2", "食物", "#EF4444", 122),
    ("57", "水果", "Fruit", "食物", "#EF4444", 124),
    ("58", "水果和坚果", "Fruit and Nuts", "食物", "#EF4444", 126),
    ("59", "草药和香料", "Herbs and Spices", "食物", "#EF4444", 128),
    ("60", "食品储藏室", "Pantry", "食物", "#EF4444", 130),
    ("61", "奶制品", "Dairy", "食物", "#EF4444", 132),
    ("62", "面包房1", "Bakery 1", "食物", "#EF4444", 134),
    ("63", "面包房2", "Bakery 2", "食物", "#EF4444", 136),
    ("64", "熟食店", "Deli", "食物", "#EF4444", 138),
    ("65", "咖啡厅1", "Cafe 1", "食物", "#EF4444", 140),
    ("66", "咖啡厅2", "Cafe 2", "食物", "#EF4444", 142),
    ("67", "糖果和甜食", "Candy and Sweets", "食物", "#EF4444", 143),
    ("68", "酒吧", "Bar", "食物", "#EF4444", 144),
    ("69", "餐厅", "Restaurant", "食物", "#EF4444", 146),
    ("70", "快餐", "Fast Food", "食物", "#EF4444", 148),
    ("71", "早餐", "Breakfast", "食物", "#EF4444", 150),
    ("72", "午餐和晚餐", "Lunch and Dinner", "食物", "#EF4444", 152),
    ("73", "学校", "School", "学习", "#3B82F6", 154),
    ("74", "数学", "Math", "学习", "#3B82F6", 156),
    ("75", "物理", "Physics", "学习", "#3B82F6", 158),
    ("76", "化学", "Chemistry", "学习", "#3B82F6", 160),
    ("77", "生物", "Biology", "学习", "#3B82F6", 162),
    ("78", "元素周期表", "Periodic Table", "学习", "#3B82F6", 164),
    ("79", "历史", "History", "学习", "#3B82F6", 166),
    ("80", "大学", "University", "学习", "#3B82F6", 168),
    ("81", "工作", "Work", "工作", "#8B5CF6", 170),
    ("82", "办公室", "Office", "工作", "#8B5CF6", 172),
    ("83", "电子计算机和科技", "Computers and Technology", "工作", "#8B5CF6", 174),
    ("84", "传媒业", "Media", "工作", "#8B5CF6", 176),
    ("85", "法律业", "Law", "工作", "#8B5CF6", 178),
    ("86", "农业", "Agriculture", "工作", "#8B5CF6", 180),
    ("87", "建筑业", "Construction", "工作", "#8B5CF6", 182),
    ("88", "军事", "Military", "工作", "#8B5CF6", 184),
    ("89", "职业1", "Occupations 1", "工作", "#8B5CF6", 186),
    ("90", "职业2", "Occupations 2", "工作", "#8B5CF6", 188),
    ("91", "行业和部门", "Industries and Sectors", "工作", "#8B5CF6", 190),
    ("92", "求职", "Job Hunting", "工作", "#8B5CF6", 192),
    ("93", "职场技能", "Workplace Skills", "工作", "#8B5CF6", 194),
    ("94", "金钱和金融", "Money and Finance", "工作", "#8B5CF6", 196),
    ("95", "开会和报告", "Meetings and Reports", "工作", "#8B5CF6", 198),
    ("96", "道路", "Roads", "交通", "#F59E0B", 200),
    ("97", "车辆1", "Vehicles 1", "交通", "#F59E0B", 202),
    ("98", "车辆2", "Vehicles 2", "交通", "#F59E0B", 204),
    ("99", "汽车和公共汽车", "Cars and Buses", "交通", "#F59E0B", 206),
    ("100", "摩托车", "Motorcycle", "交通", "#F59E0B", 208),
    ("101", "自行车", "Bicycle", "交通", "#F59E0B", 210),
    ("102", "大车", "Trucks", "交通", "#F59E0B", 212),
    ("103", "飞机", "Airplane", "交通", "#F59E0B", 214),
    ("104", "机场", "Airport", "交通", "#F59E0B", 216),
    ("105", "海上船舶", "Ships", "交通", "#F59E0B", 218),
    ("106", "港口", "Port", "交通", "#F59E0B", 220),
    ("107", "美式橄榄球", "American Football", "运动", "#EC4899", 222),
    ("108", "橄榄球", "Rugby", "运动", "#EC4899", 224),
    ("109", "足球", "Soccer", "运动", "#EC4899", 226),
    ("110", "冰球和长曲棍球", "Hockey and Lacrosse", "运动", "#EC4899", 228),
    ("111", "板球", "Cricket", "运动", "#EC4899", 230),
    ("112", "篮球和排球", "Basketball and Volleyball", "运动", "#EC4899", 232),
    ("113", "棒球", "Baseball", "运动", "#EC4899", 234),
    ("114", "网球", "Tennis", "运动", "#EC4899", 236),
    ("115", "高尔夫", "Golf", "运动", "#EC4899", 238),
    ("116", "田径运动", "Track and Field", "运动", "#EC4899", 240),
    ("117", "格斗运动", "Combat Sports", "运动", "#EC4899", 242),
    ("118", "游泳", "Swimming", "运动", "#EC4899", 244),
    ("119", "帆船和水上运动", "Sailing and Water Sports", "运动", "#EC4899", 246),
    ("120", "马术", "Equestrian", "运动", "#EC4899", 248),
    ("121", "钓鱼", "Fishing", "运动", "#EC4899", 250),
    ("122", "冬季运动", "Winter Sports", "运动", "#EC4899", 252),
    ("123", "赛车", "Racing", "运动", "#EC4899", 254),
    ("124", "体育馆", "Gym", "运动", "#EC4899", 256),
    ("125", "其他运动", "Other Sports", "运动", "#EC4899", 258),
    ("126", "旅行", "Travel", "休闲", "#06B6D4", 260),
    ("127", "电影", "Movies", "休闲", "#06B6D4", 262),
    ("128", "音乐1", "Music 1", "休闲", "#06B6D4", 264),
    ("129", "音乐2", "Music 2", "休闲", "#06B6D4", 266),
    ("130", "博物馆和画廊", "Museums and Galleries", "休闲", "#06B6D4", 268),
    ("131", "旅游和住宿", "Tourism and Accommodation", "休闲", "#06B6D4", 270),
    ("132", "景观", "Landscapes", "休闲", "#06B6D4", 272),
    ("133", "户外活动", "Outdoor Activities", "休闲", "#06B6D4", 274),
    ("134", "海滩", "Beach", "休闲", "#06B6D4", 276),
    ("135", "露营", "Camping", "休闲", "#06B6D4", 278),
    ("136", "家庭娱乐", "Home Entertainment", "休闲", "#06B6D4", 280),
    ("137", "电视", "Television", "休闲", "#06B6D4", 282),
    ("138", "图书和阅读", "Books and Reading", "休闲", "#06B6D4", 284),
    ("139", "幻想和神话", "Fantasy and Mythology", "休闲", "#06B6D4", 286),
    ("140", "游戏", "Games", "休闲", "#06B6D4", 288),
    ("141", "艺术和手工1", "Arts and Crafts 1", "休闲", "#06B6D4", 290),
    ("142", "艺术和手工2", "Arts and Crafts 2", "休闲", "#06B6D4", 292),
    ("143", "太空1", "Space 1", "环境", "#22C55E", 294),
    ("144", "太空2", "Space 2", "环境", "#22C55E", 296),
    ("145", "地球", "Earth", "环境", "#22C55E", 298),
    ("146", "地理1", "Geography 1", "环境", "#22C55E", 300),
    ("147", "地理2", "Geography 2", "环境", "#22C55E", 302),
    ("148", "地图和方向", "Maps and Directions", "环境", "#22C55E", 304),
    ("149", "国家1", "Countries 1", "环境", "#22C55E", 306),
    ("150", "国家2", "Countries 2", "环境", "#22C55E", 308),
    ("151", "国家3", "Countries 3", "环境", "#22C55E", 310),
    ("152", "国籍1", "Nationalities 1", "环境", "#22C55E", 312),
    ("153", "国籍2", "Nationalities 2", "环境", "#22C55E", 314),
    ("154", "天气", "Weather", "环境", "#22C55E", 316),
    ("155", "气候和环境", "Climate and Environment", "环境", "#22C55E", 318),
    ("156", "岩石和矿物", "Rocks and Minerals", "环境", "#22C55E", 320),
    ("157", "自然史", "Natural History", "自然世界", "#22C55E", 322),
    ("158", "哺乳动物1", "Mammals 1", "自然世界", "#22C55E", 324),
    ("159", "哺乳动物2", "Mammals 2", "自然世界", "#22C55E", 326),
    ("160", "鸟类1", "Birds 1", "自然世界", "#22C55E", 328),
    ("161", "鸟类2", "Birds 2", "自然世界", "#22C55E", 330),
    ("162", "昆虫和其他无脊椎动物", "Insects and Invertebrates", "自然世界", "#22C55E", 332),
    ("163", "两栖动物和爬行动物", "Amphibians and Reptiles", "自然世界", "#22C55E", 334),
    ("164", "宠物", "Pets", "自然世界", "#22C55E", 336),
    ("165", "农场动物", "Farm Animals", "自然世界", "#22C55E", 338),
    ("166", "海洋生物", "Marine Life", "自然世界", "#22C55E", 340),
    ("167", "植物和树木1", "Plants and Trees 1", "自然世界", "#22C55E", 342),
    ("168", "植物和树木2", "Plants and Trees 2", "自然世界", "#22C55E", 344),
    ("169", "植物和树木3", "Plants and Trees 3", "自然世界", "#22C55E", 346),
    ("170", "真菌", "Fungi", "自然世界", "#22C55E", 348),
    ("171", "时间", "Time", "参考", "#6B7280", 350),
    ("172", "日历", "Calendar", "参考", "#6B7280", 352),
    ("173", "数字", "Numbers", "参考", "#6B7280", 354),
    ("174", "称重和测量", "Weights and Measures", "参考", "#6B7280", 356),
    ("175", "写作", "Writing", "参考", "#6B7280", 358),
    ("176", "事物描述1", "Describing Things 1", "参考", "#6B7280", 360),
    ("177", "事物描述2", "Describing Things 2", "参考", "#6B7280", 362),
    ("178", "常见动词短语", "Common Phrasal Verbs", "参考", "#6B7280", 364),
    ("179", "惯用表达1", "Idioms 1", "参考", "#6B7280", 366),
    ("180", "惯用表达2", "Idioms 2", "参考", "#6B7280", 368),
]

def get_page_range(idx):
    start = TOPICS[idx][5]
    if idx + 1 < len(TOPICS):
        end = TOPICS[idx + 1][5] - 1
    else:
        end = start + 1
    return start, end

def extract_all_images():
    os.makedirs(IMG_DIR, exist_ok=True)
    doc = fitz.open(PDF_PATH)
    pages_needed = set()
    for i, t in enumerate(TOPICS):
        s, e = get_page_range(i)
        for p in range(s, e + 1):
            pages_needed.add(p)

    print(f"Extracting {len(pages_needed)} pages...")
    for page_num in sorted(pages_needed):
        out = os.path.join(IMG_DIR, f'page_{page_num}.jpg')
        if os.path.exists(out):
            continue
        page = doc[page_num - 1]
        pix = page.get_pixmap(dpi=150)
        pix.save(out)
    doc.close()
    print("Done extracting images.")

def build_topics_index():
    os.makedirs(DATA_DIR, exist_ok=True)
    categories = {}
    for i, (tid, title, title_en, cat, color, page) in enumerate(TOPICS):
        if cat not in categories:
            categories[cat] = {"name": cat, "color": color, "topics": []}
        s, e = get_page_range(i)
        has_data = os.path.exists(os.path.join(DATA_DIR, f'topic-{tid}.json'))
        categories[cat]["topics"].append({
            "id": tid,
            "title": title,
            "titleEn": title_en,
            "startPage": s,
            "endPage": e,
            "totalWords": 0,
            "hasData": has_data
        })

    index = {"categories": list(categories.values())}

    # Update totalWords from existing data files
    for cat in index["categories"]:
        for topic in cat["topics"]:
            data_file = os.path.join(DATA_DIR, f'topic-{topic["id"]}.json')
            if os.path.exists(data_file):
                with open(data_file) as f:
                    data = json.load(f)
                total = sum(len(p["words"]) for p in data["pages"])
                topic["totalWords"] = total
                topic["hasData"] = True

    with open(os.path.join(DATA_DIR, 'topics-index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Built topics index with {len(TOPICS)} topics in {len(categories)} categories.")

if __name__ == '__main__':
    extract_all_images()
    build_topics_index()
