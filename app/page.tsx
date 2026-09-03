"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { WorkbenchGuide } from '../components/WorkbenchGuide';
import { SimulationContainer, ParameterSchema } from '../components/SimulationContainer';
import { SimulationInfo, Grade, Subject } from '../types';

// Import all 14 simulations
import { SoundWaves } from '../simulations/SoundWaves';
import { ReflectionRefraction } from '../simulations/ReflectionRefraction';
import { ConvexLens } from '../simulations/ConvexLens';
import { MeltingCurve } from '../simulations/MeltingCurve';
import { LeverBalance } from '../simulations/LeverBalance';
import { FreeFallComparison } from '../simulations/FreeFallComparison';
import { OhmsLaw } from '../simulations/OhmsLaw';
import { ProjectileMotion } from '../simulations/ProjectileMotion';
import { UniformAcceleration } from '../simulations/UniformAcceleration';
import { SimplePendulum } from '../simulations/SimplePendulum';
import { SpringMassSystem } from '../simulations/SpringMassSystem';
import { ForceComposition } from '../simulations/ForceComposition';
import { DopplerEffect } from '../simulations/DopplerEffect';
import { ClosedCircuitOhm } from '../simulations/ClosedCircuitOhm';
import { DoubleSlitInterference } from '../simulations/DoubleSlitInterference';
import { IdealGasLaw } from '../simulations/IdealGasLaw';
import { HollowBallCollision } from '../simulations/HollowBallCollision';
import { LandingPage } from '../components/LandingPage';
import { ChemistryLab } from '../simulations/ChemistryLab';
import AiLabView from '../components/AiLabView';
import MyExperimentsView from '../components/MyExperimentsView';
import AboutView from '../components/AboutView';

// Chemistry experiment wrappers to prevent remounting
const KClO3OxygenSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="kclo3-oxygen" />;
const IronOxygenSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="iron-oxygen" />;
const PhosphorusOxygenSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="phosphorus-oxygen" />;
const SulfurOxygenSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="sulfur-oxygen" />;
const Co2NaohSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="co2-naoh" />;
const ElectrolysisWaterSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="electrolysis-water" />;
const SaltPurificationSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="salt-purification" />;
const OxygenLabSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="oxygen-lab" />;
const Co2LabSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="co2-lab" />;
const MetalReactionsSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="metal-reactions" />;
const CombustionConditionsSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="combustion-conditions" />;
const NaclSolutionSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="nacl-solution" />;
const AcidBaseSim: React.FC<any> = (props) => <ChemistryLab {...props} experimentId="acid-base" />;

export default function Page() {
  const [currentView, setCurrentView] = useState<'landing' | 'workbench' | 'ai-lab' | 'my-experiments' | 'about'>('landing');
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade>('junior');
  const [subject, setSubject] = useState<Subject>('physics');
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Setup theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (isLightMode) {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [isLightMode]);

  // Scroll to top when view or selected simulation changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [currentView, selectedSimId]);

  // Registry of all simulations with metadata, schemas, theory, and quizzes
  const allSimulations: SimulationInfo[] = [
    // --- JUNIOR HIGH SCHOOL SIMULATIONS ---
    {
      id: 'sound-waves',
      name: '声音的特征',
      grade: 'junior',
      category: 'sound',
      description: '探究声音的波形与音调（频率）、响度（振幅）以及音色的关系，利用声波示波器直观观察声音的变化。',
      component: SoundWaves,
      theory: {
        title: '声音的特征与波形',
        formula: '音调 ∝ 频率 (Hz)   |   响度 ∝ 振幅 (A)',
        description: '声音是由物体的振动产生的，并以声波的形式在介质（空气、水、固体等）中向四周传播。在物理学中，我们常用三个特征来描述声音：音调（决定于声波的频率）、响度（决定于声波的振幅）以及音色（决定于声波的波形结构）。',
        points: [
          '音调（Pitch）：指声音的高低。声源振动得越快，其频率（每秒振动次数，单位是赫兹 Hz）就越高，音调也就越高。',
          '响度（Loudness）：指声音的大小。声波振动的幅度越大，响度也就越大。振幅携带能量的大小，声音大小通常用分贝（dB）度量。',
          '音色（Timbre）：由于各种发声体（声源）的结构和材料不同，它们发出的声波形状不同，即使频率和振幅相同，音色也不同。',
          '声波在示波器上的呈现：正弦波听起来最纯净，方波听起来较刺耳响亮，三角波具有明亮的金属感。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '用同样的力敲击一把钢尺，如果尺子伸出桌面的长度变短，则发出声音的？',
            options: ['音调变高', '音调变低', '响度变大', '响度变小'],
            correctAnswer: 0,
            explanation: '钢尺伸出桌面的部分越短，振动的频率越高，因此发出的声音音调会变高。'
          },
          {
            question: '人耳能听到的频率范围是 20Hz - 20000Hz。将模拟器中的频率调整为 80Hz 并开启音效，我们听到的是？',
            options: ['听不到声音，因为频率太低', '听到尖锐刺耳的高音', '听到低沉厚重的低音', '听到震耳欲聋的声音']
            ,correctAnswer: 2,
            explanation: '80Hz 处于 20Hz - 20000Hz 之间，属于可听声波。由于频率偏低，听感上会非常低沉，属于低音。'
          }
        ]
      }
    },
    {
      id: 'reflection-refraction',
      name: '光的反射与折射',
      grade: 'junior',
      category: 'light',
      description: '探究光线在两种不同折射率介质界面的反射与折射规律，验证反射角与折射角的关系，并观察全反射现象。',
      component: ReflectionRefraction,
      theory: {
        title: '光的反射与折射定律（Snell\'s Law）',
        formula: 'θ反射 = θ入射   |   n₁ sin(θ₁) = n₂ sin(θ₂)',
        description: '光从一种介质射向另一种介质时，在交界面处会同时发生反射和折射。反射角等于入射角。折射角遵循折射定律（斯涅尔定律）：入射介质折射率与入射角正弦值的乘积等于折射介质折射率与折射角正弦值的乘积。',
        points: [
          '反射定律：反射光线、入射光线与法线在同一平面内；反射光线和入射光线分居在法线两侧；反射角等于入射角。',
          '折射定律：光从光疏介质（折射率小，如空气）斜射入光密介质（折射率大，如水或玻璃）时，折射光线向法线偏折，折射角小于入射角。',
          '全反射（Total Internal Reflection）：光从光密介质射向光疏介质（如从玻璃射入空气）时，折射角大于入射角。当入射角大于临界角 θc = arcsin(n2/n1) 时，折射光消失，光线全部被反射回原介质内。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '当光从空气 (n₁=1.0) 射向水 (n₂=1.33)，入射角为 45° 时，折射角应该？',
            options: ['大于 45°', '等于 45°', '小于 45°', '等于 90°'],
            correctAnswer: 2,
            explanation: '水是光密介质 (n₂ > n₁)，光从光疏射入光密介质，折射光线会向法线偏折，因此折射角小于入射角。'
          },
          {
            question: '全反射现象只可能发生在以下哪种情况中？',
            options: ['光从空气斜射入水', '光从玻璃斜射入空气', '光从真空斜射入玻璃', '光从折射率低的介质射入折射率高的介质'],
            correctAnswer: 1,
            explanation: '发生全反射的两个必要条件是：1. 光必须从光密介质（折射率高）射向光疏介质（折射率低）；2. 入射角必须大于或等于临界角。'
          }
        ]
      }
    },
    {
      id: 'convex-lens',
      name: '凸透镜成像规律',
      grade: 'junior',
      category: 'light',
      description: '通过移动蜡烛物距，探究并验证凸透镜的一倍焦距与两倍焦距成像规律，区分实像与虚像。',
      component: ConvexLens,
      theory: {
        title: '凸透镜成像规律与公式',
        formula: '1/u + 1/v = 1/f   |   放大率 β = -v/u',
        description: '凸透镜具有汇聚光线的作用。物体通过凸透镜成像的大小、虚实、倒正由物距（u，物体到透镜的距离）和焦距（f，透镜的焦距）共同决定。可以通过作图法（三条特殊光线）或透镜成像公式来计算像距（v）和像的性质。',
        points: [
          'u > 2f：成倒立、缩小的实像。像距 f < v < 2f。应用：照相机。',
          'u = 2f：成倒立、等大的实像。像距 v = 2f。可用于粗测透镜焦距。',
          'f < u < 2f：成倒立、放大的实像。像距 v > 2f。应用：投影仪。',
          'u = f：平行光线射出，不成像。',
          'u < f：成正立、放大的虚像。像与物体同侧。应用：放大镜。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '若凸透镜焦距 f = 10cm，将蜡烛放在物距 u = 15cm 的位置，在光屏上能得到？',
            options: ['正立放大的虚像', '倒立缩小的实像', '倒立等大的实像', '倒立放大的实像'],
            correctAnswer: 3,
            explanation: '10cm < u < 20cm 满足 f < u < 2f 的条件，此时成倒立放大的实像。'
          },
          {
            question: '在使用照相机照相时，想让底片（光屏）上的像稍微变大一点，应该采取的操作是？',
            options: ['将相机靠近人，同时拉长镜头（增加像距）', '将相机靠近人，同时缩短镜头（减小像距）', '将相机远离人，同时拉长镜头（增加像距）', '将相机远离人，同时缩短镜头（减小像距）'],
            correctAnswer: 0,
            explanation: '根据凸透镜成像规律：“物近像远像变大”。要想把像变大，必须减小物体到透镜的距离（相机靠近人），同时增大透镜到胶片的距离（拉长镜头）。'
          }
        ]
      }
    },
    {
      id: 'melting-curve',
      name: '冰的熔化与凝固曲线',
      grade: 'junior',
      category: 'heat',
      description: '观察冰在加热时从固态向液态和气态变化的微观模型，绘制温度-时间曲线，理解熔点与晶体吸热的含义。',
      component: MeltingCurve,
      theory: {
        title: '晶体的熔化与沸腾物理规律',
        formula: 'Q = c·m·ΔT (升温吸热)   |   Q熔 = m·L_f (晶体熔化潜热)',
        description: '冰作为晶体，在熔化时有一个固定的温度（熔点 0℃）。加热过程中，当冰的温度达到 0℃ 之前，吸收热量使温度升高；当温度达到 0℃ 时，继续吸收热量用于破坏固体晶格结构（冰融化成水），此阶段温度保持 0℃ 不变，直到冰完全熔化；水在沸腾时继续吸收热量但温度保持 100℃ 不变。',
        points: [
          '熔点（Melting Point）：晶体熔化时的温度。非晶体（如沥青、玻璃）熔化时没有固定的熔点。',
          '晶体熔化条件：1. 温度达到熔点；2. 必须继续吸热。熔化过程中处于固液共存态。',
          '潜热（Latent Heat）：熔化和汽化（沸腾）都需要在恒定温度下吸收大量能量（潜热），用以改变分子间的相对状态，而不是用来升温。',
          '微观结构：固态分子在固定格点振动；液态分子失去固定排列，可以自由流动；气态分子间距极大，在空间内杂乱无章做自由碰撞。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在炎热夏天的烈日下，一盆冰水混合物正在慢慢熔化，当冰块未全部熔化前，关于其温度说法正确的是？',
            options: ['冰的温度低，水的温度高', '整盆混合物的温度保持在 0℃ 左右', '随着熔化，整盆水的温度慢慢上升', '温度已经高于 0℃，因为太阳很热'],
            correctAnswer: 1,
            explanation: '冰是晶体，冰水混合物在熔化阶段属于固液共存状态，温度将一直维持在熔点（0℃）不变，直到冰完全熔化成水。'
          },
          {
            question: '在加热冰块的模拟中，当温度在 0℃ 维持不变时，所吸收的热量去哪里了？',
            options: ['流失到周围的环境中了', '用来改变冰分子的微观晶格结构，使分子能流动', '被冰分子转化为重力势能了', '加热器在这个温度下停止了输送热量'],
            correctAnswer: 1,
            explanation: '熔化期间吸收的热量称为熔化潜热，不用于提高温度（不增加分子平均动能），而是用于破坏冰分子间的晶格束缚，将其转变为液态。'
          }
        ]
      }
    },
    {
      id: 'lever-balance',
      name: '杠杆平衡条件',
      grade: 'junior',
      category: 'force',
      description: '探究杠杆的平衡状态，自由拖动砝码到左侧与右侧的不同力臂插槽，计算并验证力矩平衡原理。',
      component: LeverBalance,
      theory: {
        title: '杠杆平衡条件与力矩',
        formula: 'F₁·L₁ = F₂·L₂  (动力 × 动力臂 = 阻力 × 阻力臂)',
        description: '杠杆是在力的作用下能绕固定点转动的硬棒。杠杆的平衡是指杠杆处于静止或匀速转动的状态。杠杆平衡条件（阿基米德杠杆定律）表明：动力和动力臂的乘积等于阻力和阻力臂的乘积。',
        points: [
          '支点（O）：杠杆绕着转动的固定点。',
          '力臂：支点到力的作用线的**垂直距离**（不是支点到力的作用点的距离）。',
          '省力杠杆：动力臂大于阻力臂（L1 > L2），省力但费距离（如开瓶器、钢丝钳）。',
          '费力杠杆：动力臂小于阻力臂（L1 < L2），费力但省距离（如钓鱼竿、镊子）。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在平衡杠杆的左侧距离支点 2 格（L1=2）的位置挂上 4 个 50g 砝码（即阻力 F1 = 200g），要在右侧距离支点 4 格（L2=4）的位置平衡杠杆，需要挂几个 50g 砝码？',
            options: ['1个', '2个', '3个', '4个'],
            correctAnswer: 1,
            explanation: '根据杠杆平衡条件 F1 * L1 = F2 * L2。左侧力矩 = 200g * 2格 = 400 g·格。右侧距离为 4格，因此需要阻力 F2 = 400 / 4 = 100g，即悬挂 2 个 50g 砝码。'
          },
          {
            question: '用扁担挑水时，为了省力，应该把水桶？',
            options: ['往扁担两端挪动，增大阻力臂', '往肩膀支点靠拢，减小阻力臂', '一端靠拢一端远离', '没有区别，省力只取决于水桶重量'],
            correctAnswer: 1,
            explanation: '挑水时肩膀是支点，水桶重量是阻力。将水桶向支点（肩膀）挪动可以减小阻力臂，从而使得肩膀受到的力臂减小，起到省力的效果。'
          }
        ]
      }
    },
    {
      id: 'free-fall',
      name: '自由落体对比实验',
      grade: 'junior',
      category: 'force',
      description: '重现伽利略的比萨斜塔落体实验。在真空和空气阻力环境下对比不同质量物体的下落，观察阻力对运动的影响。',
      component: FreeFallComparison,
      theory: {
        title: '自由落体运动与重力加速度',
        formula: 'y = ½gt² (真空自由落体)   |   a = g - (k/m)·v (考虑空气阻力)',
        description: '物体只在重力作用下从静止开始下落的运动，叫做自由落体运动。伽利略通过斜面实验和推理，否定了亚里士多德“重物下落快，轻物下落慢”的错误观点，指出：在真空无阻力的环境下，一切物体下落的加速度（重力加速度 g）都相同，与质量无关。',
        points: [
          '重力加速度（g）：在地球表面约为 9.8 m/s²，方向竖直向下。',
          '自由落体性质：初速度为零、加速度为 g 的匀加速直线运动。',
          '空气阻力的影响：在有空气的环境中，物体受到的阻力与其速度和接触面积有关。轻而蓬松的物体（如羽毛）所受阻力很快与重力平衡，达到极低的终端速度，因而下落慢。',
          '验证：模拟器中开启“真空模式”时，无论选择铁球、木球还是羽毛，它们都将同时着地。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '如果在一个完全抽成真空的容器中，让铁球和羽毛从同一高度同时自由下落，则？',
            options: ['铁球先着地，因为铁球重', '羽毛先着地，因为羽毛阻力小', '铁球和羽毛同时着地', '铁球和羽毛悬浮在半空中'],
            correctAnswer: 2,
            explanation: '在真空环境下没有空气阻力，一切物体都只受重力，其下落的加速度均为重力加速度 g。因此不同质量、形状的物体会同时着地。'
          },
          {
            question: '在正常空气中，羽毛下落一段距离后会保持匀速直线运动，这是因为？',
            options: ['羽毛不受重力作用了', '羽毛受到空气的阻力与重力大小相等、方向相反', '羽毛的惯性消失了', '重力加速度 g 在空中变小了'],
            correctAnswer: 1,
            explanation: '当物体下落速度变快时，空气阻力会随之增大。当阻力增大到与物体的重力相等时，合外力为零，根据牛顿第一定律，物体开始做匀速直线运动，该速度称为终端速度。'
          }
        ]
      }
    },
    {
      id: 'ohms-law',
      name: '欧姆定律',
      grade: 'junior',
      category: 'electricity',
      description: '探究一段电路中电流、电压与电阻的三者关系。提供微观导线电子移动动效，展现电压和电阻的微观含义。',
      component: OhmsLaw,
      theory: {
        title: '欧姆定律的微观及宏观规律',
        formula: 'I = U / R  (电流 = 电压 / 电阻)',
        description: '欧姆定律是电学中最基础的定律。导体中的电流与导体两端的电压成正比，与导体的电阻成反比。微观上，电流是自由电子定向移动形成的。电压提供电场（驱动电子流动的动力），电阻是电子与金属晶格碰撞受到的阻碍。',
        points: [
          '电流（I，安培 A）：单位时间内通过导体横截面的电荷量。微观电子流动越快，电流越大。',
          '电压（U，伏特 V）：电路中产生电流的驱动力，类似于水路中的“水压”。',
          '电阻（R，欧姆 Ω）：导体对电流的阻碍作用。微观上是由于电子在流动中与导体内原子不断发生非弹性碰撞。',
          '微观演示：阻值越大，晶格散射红点变密，碰撞频率提高，导致电子漂移速率变慢，电流减小。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '某电阻两端电压为 6V 时，通过的电流是 0.3A。若将该电阻两端电压调至 12V，则该电阻的阻值和通过的电流是？',
            options: ['电阻 20Ω，电流 0.6A', '电阻 40Ω，电流 0.3A', '电阻 20Ω，电流 0.3A', '电阻 40Ω，电流 0.6A'],
            correctAnswer: 0,
            explanation: '首先根据欧姆定律计算阻值：R = U / I = 6V / 0.3A = 20Ω。电阻是导体本身的属性，不随电压改变。当电压变为 12V 时，电流 I = U\' / R = 12V / 20Ω = 0.6A。'
          },
          {
            question: '微观上，以下关于电阻的说法正确的是？',
            options: ['电阻阻碍电流，是因为它吸收了自由电子', '电阻越大，是因为导线内部可运动的电子越少', '电阻阻碍电流，是因为运动的电子与晶格中原子发生了剧烈的碰撞', '电阻大是因为导线太短，电子无法通过'],
            correctAnswer: 2,
            explanation: '金属导电的微观实质是自由电子在电场力作用下漂移。在漂移过程中，电子会与金属点阵上的正离子（原子）发生碰撞而散射，这种碰撞阻碍了电子的运动，在宏观上就表现为电阻。'
          }
        ]
      }
    },

    // --- SENIOR HIGH SCHOOL SIMULATIONS ---
    {
      id: 'projectile-motion',
      name: '平抛运动的规律',
      grade: 'senior',
      category: 'motion',
      description: '探究二维平抛运动。将运动分解为水平匀速运动与竖直自由落体，配有速度分量矢量箭头，附带打靶靶标互动。',
      component: ProjectileMotion,
      theory: {
        title: '平抛运动公式与分解',
        formula: '水平位移: x = v₀·t,  竖直位移: y = H - ½gt²   |   vx = v₀,  vy = g·t',
        description: '将物体以一定的初速度 v0 沿水平方向抛出，物体只在重力作用下发生的运动叫做平抛运动。平抛运动是典型的匀变速曲线运动。通常可以分解为：水平方向的匀速直线运动，以及竖直方向的自由落体运动。',
        points: [
          '水平分运动：不受外力作用，加速度 ax = 0，做速度为 v0 的匀速直线运动。',
          '竖直分运动：仅受重力作用，加速度 ay = g，初速度为零，做自由落体运动。',
          '合运动轨迹：抛物线。合速度大小 v = √(vx² + vy²)，方向与水平夹角 θ = arctan(vy/vx)。',
          '运动时间：仅由初始抛出高度决定，t = √(2H/g)，与初速度 v0 无关。水平射程 x = v0 * t。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在两个不同高度发射平抛炮弹，初速度相同，如果甲的高度是乙的 4 倍，则甲在空中的飞行时间是乙的？',
            options: ['1/2 倍', '1 倍', '2 倍', '4 倍'],
            correctAnswer: 2,
            explanation: '由平抛时间公式 t = √(2H/g) 可知，飞行时间 t 正比于高度 H 的平方根。甲的高度是乙的 4 倍，则时间是乙的 √4 = 2 倍。'
          },
          {
            question: '关于平抛运动的速度矢量箭头，下列描述正确的是？',
            options: ['水平方向速度矢量随时间越来越长', '竖直方向速度矢量长度保持不变', '水平速度矢量长度不变，竖直速度矢量随时间越来越长', '合速度矢量的方向始终与抛出方向平行'],
            correctAnswer: 2,
            explanation: '平抛运动中，水平方向分速度 v_x = v_0 保持不变（矢量长度恒定）；竖直方向做自由落体运动，竖直分速度 v_y = g*t 随时间增长（矢量向下延长）。'
          }
        ]
      }
    },
    {
      id: 'uniform-acceleration',
      name: '匀变速直线运动',
      grade: 'senior',
      category: 'motion',
      description: '演示匀变速直线运动（加速度可为正或负），展示实时速度矢量与加速度矢量，并同步绘制 s-t、v-t、a-t 三轴图。',
      component: UniformAcceleration,
      theory: {
        title: '匀变速直线运动公式与图像',
        formula: '位移: x = v₀·t + ½at²   |   速度: v = v₀ + a·t   |   导出式: v² - v₀² = 2a·x',
        description: '沿着一条直线且加速度保持不变的运动，叫做匀变速直线运动。这是一种典型的理想运动状态。如果加速度方向与初速度方向相同，则做匀加速运动；反之，若加速度与初速度反向，做匀减速运动。',
        points: [
          's-t 图像：由于位移是时间的二次函数，其在位移-时间图上呈现为一条抛物线。',
          'v-t 图像：速度是时间的一次线性函数，在 v-t 图上是一条倾斜直线，直线的斜率表示加速度（a = dv/dt）。',
          '图线“面积”：在速度-时间（v-t）图像中，图线与时间轴包围的面积等于该段时间内物体的位移。',
          '加速度 a-t 图像：由于加速度恒定，因此是一条平行于时间轴的水平直线。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '若物体的初速度 v₀ > 0，且加速度 a < 0 恒定，则物体会？',
            options: ['一直做减速运动直到静止', '先做减速直线运动，速度减为零后反向加速', '直接朝反方向加速运动', '做速度大小不变的曲线运动'],
            correctAnswer: 1,
            explanation: '因为 a 与 v_0 反向，物体首先做匀减速直线运动。当速度减为 0 时，加速度依然存在且反向，因此物体会以此加速度沿相反方向做匀加速直线运动。'
          },
          {
            question: '在速度-时间 (v-t) 图像中，关于斜率和面积的说法正确的是？',
            options: ['斜率表示位移，面积表示加速度', '斜率表示加速度，面积表示位移', '斜率表示力，面积表示加速度', '斜率表示时间，面积表示速度'],
            correctAnswer: 1,
            explanation: '在 v-t 图像中，斜率（速度变化率）代表加速度，图线与时间轴包围的区域“面积”代表该段时间内的位移。'
          }
        ]
      }
    },
    {
      id: 'simple-pendulum',
      name: '单摆运动与机械能守恒',
      grade: 'senior',
      category: 'force',
      description: '使用 Runge-Kutta 算法模拟高精度单摆简谐运动，展示回复力与张力矢量，并动态渲染 Ek-Ep 能守恒条形图。',
      component: SimplePendulum,
      theory: {
        title: '单摆简谐运动与能量转换',
        formula: '单摆周期: T ≈ 2π√(L/g) (小角摆动)   |   系统能量: E机械 = Ek + Ep = 恒量',
        description: '单摆在细绳拉力与重力作用下在竖直平面内摆动。当单摆的摆角较小（一般小于 10°）时，摆球受到的回复力 F = -mg sinθ ≈ -mgθ 正比于位移，单摆运动可以近似为简谐运动。在没有空气阻力时，摆球动能（Ek）和重力势能（Ep）相互转化，系统机械能保持守恒。',
        points: [
          '回复力（Restoring Force）：重力沿轨迹切向的分力，指向平衡位置，F = -mg sinθ。',
          '单摆周期（T）：公式表明周期仅由摆长 L 和当地重力加速度 g 决定，与摆球质量和振幅无关（等时性）。',
          '动能与势能转换：在最高点，速度为 0，势能 Ep 最大，动能 Ek 为 0；在最低点（平衡位置），速度最大，动能最大，势能为 0。',
          '有阻尼状态：若有空气阻力（阻尼），系统机械能不断转化为内能（热量），摆幅会逐渐衰减直到停止。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '若要将一个单摆在某地小角度摆动的周期缩短为原来的一半，应该采取以下哪种措施？',
            options: ['将摆球质量减小为原来的 1/2', '将摆线长度缩短为原来的 1/4', '将摆球质量增加为原来的 2 倍', '将单摆初始释放角度调大 2 倍'],
            correctAnswer: 1,
            explanation: '由周期公式 T = 2π√(L/g) 可知，周期 T 正比于摆长 L 的平方根。要使周期 T 减半，摆长 L 必须缩短为原来的 1/4。'
          },
          {
            question: '如果单摆的空气阻尼系数设为 0（无阻力），在摆动过程中，代表总机械能（E）的柱状图将？',
            options: ['随着动能的增大而变长', '随着势能的增大而变短', '保持水平高度不变，数值恒定', '随时间逐渐衰减到零'],
            correctAnswer: 2,
            explanation: '无空气阻力时，由于没有非保守力做功，单摆系统满足机械能守恒定律，动能和重力势能可以完全相互转化，但两者之和（总机械能 E）始终保持恒定。'
          }
        ]
      }
    },
    {
      id: 'spring-mass',
      name: '弹簧振子的简谐运动',
      grade: 'senior',
      category: 'force',
      description: '模拟弹簧在水平轨道上的简谐振动。动态画出弹簧拉伸/压缩，给出弹力与速度矢量，并绘制 x-t 位移正弦波。',
      component: SpringMassSystem,
      theory: {
        title: '弹簧振子简谐运动与胡克定律',
        formula: '回复力: F = -k·x (胡克定律)   |   振动周期: T = 2π√(m/k)',
        description: '弹簧振子是由弹簧和连接在上面的物体组成的简谐运动系统。弹簧形变产生回复力，力的大小与形变量（位移 x）成正比，方向始终指向平衡位置。这个弹力规律就是胡克定律。',
        points: [
          '回复力：F = -kx，负号表示回复力方向与位移方向相反（即始终指向平衡位置 O）。',
          '简谐运动周期（T）：仅由物体质量 m 和弹簧的劲度系数 k 决定，与振幅无关。',
          '振动方程：x(t) = A cos(ωt + φ)，其运动轨迹呈现为完美的正弦或余弦波动曲线。',
          '能量转化：弹性势能 Ep = 0.5 * k * x² 与物体动能 Ek = 0.5 * m * v² 互换，总能量与振幅的平方成正比。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '弹簧振子向右运动（x > 0 且 v > 0）时，弹簧弹力 F 的方向是？',
            options: ['向右', '向左', '向下', '为零'],
            correctAnswer: 1,
            explanation: '根据胡克定律 F = -kx，由于位移 x > 0（向右），所以弹簧弹力 F < 0（向左），即弹力指向平衡位置。'
          },
          {
            question: '如果在模拟器中增加滑块的质量 m，并减小弹簧的劲度系数 k，则振子的振动周期将？',
            options: ['变长', '变短', '保持不变', '无法确定'],
            correctAnswer: 0,
            explanation: '由弹簧振子周期公式 T = 2π√(m/k) 可知，增加质量 m 且减小劲度系数 k，均会导致根号内部的数值变大，因而振动周期 T 变长。'
          }
        ]
      }
    },
    {
      id: 'force-composition',
      name: '力的合成与分解',
      grade: 'senior',
      category: 'force',
      description: '提供力的二维矢量面板，鼠标直接拖拽两个分力箭头，实时合成红色合力，以几何 parallelogram 定则展现。',
      component: ForceComposition,
      theory: {
        title: '力的合成与平行四边形定则',
        formula: '正交分解: F合x = F₁x + F₂x,  F合y = F₁y + F₂y   |   合力大小: F合 = √(F合x² + F合y²)',
        description: '力是矢量，不仅有大小而且有方向。力的合成和分解不遵循普通的代数加减，而是遵循平行四边形定则（或三角形定则）。合力与分力之间是一种等效替代关系。',
        points: [
          '平行四边形定则：以表示两个共点力 F1 和 F2 的线段为邻边作平行四边形，这两个邻边之间的对角线就表示合力的大小和方向。',
          '夹角影响：当两个分力 F1 和 F2 大小一定时，合力 F合 随分力间夹角 θ 的增大而减小。当 θ=0° 时，合力最大 (F1+F2)；当 θ=180° 时，合力最小 |F1-F2|。',
          '正交分解法：将每个力分解到水平轴（x）和竖直轴（y），然后再分别沿轴方向做代数加减，最终合成为合力。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '两个共点力的大小分别为 30N 和 40N，它们合力的最大值和最小值分别是？',
            options: ['70N 和 10N', '50N 和 10N', '70N 和 50N', '50N 和 0N'],
            correctAnswer: 0,
            explanation: '合力最大值发生在两力同方向时（夹角 0°），为 F1+F2 = 30 + 40 = 70N；合力最小值发生在两力反方向时（夹角 180°），为 |F1-F2| = |30 - 40| = 10N。所以合力范围为 10N 到 70N 之间。'
          },
          {
            question: '若两个大小相等的共点力，它们之间的夹角为 120°，则合力的大小？',
            options: ['是其中一个分力的 2 倍', '是其中一个分力的 1.732 倍', '等于其中一个分力的大小', '等于零'],
            correctAnswer: 2,
            explanation: '几何计算：对于大小均为 F 的两个力，夹角为 120° 时，作出的平行四边形其实是两个共底边的等边三角形，其对角线长度恰好等于边长 F。因此合力大小等于分力的大小。'
          }
        ]
      }
    },
    {
      id: 'doppler-effect',
      name: '多普勒效应',
      grade: 'senior',
      category: 'sound',
      description: '演示波源在运动中产生的多普勒频移，支持亚音速、音速、超音速三种模式，展示音调变化和马赫激波面。',
      component: DopplerEffect,
      theory: {
        title: '多普勒效应与超音速激波',
        formula: '多普勒频移: f\' = f₀ · [v声 / (v声 ∓ v源)]   |   马赫波激波半角: α = arcsin(v声 / v源)',
        description: '多普勒效应是指波源和观察者之间有相对运动时，观察者接收到的波的频率与波源发射的频率不同的现象。当波源向观察者靠近时，波被压缩，接收频率升高（音调变尖）；波源远离时，波被拉伸，接收频率降低。',
        points: [
          '蓝移与红移：在声学中，波源靠近导致频率变高（蓝移），波源远离导致频率变低（红移）。在天文学中同样适用于光波的红移和蓝移分析。',
          '声屏障/音障（Sonic Barrier）：当波源移动速度等于声速（vs = v_sound）时，波源跟随着它发射的声波前行，声波在前锋处剧烈堆叠，形成极高压力的空气阻力壁垒。',
          '音爆激波（Sonic Boom）：当波源以超音速运动（vs > v_sound）时，发出的所有球面波都被甩在后面，它们的包络线构成一个圆锥形的强压力冲击波（马赫锥），扫过地面时产生轰鸣的音爆。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '一辆救护车警笛鸣响并快速向你开来。与警笛本来的声音相比，你听到的声音音调？',
            options: ['变高了（音调升高）', '变低了（音调降低）', '保持不变', '忽高忽低'],
            correctAnswer: 0,
            explanation: '当救护车（声源）向你靠近时，声波在传播方向上被压缩，导致波长变短、频率变高。因此，听到的声音音调会变高。'
          },
          {
            question: '在多普勒效应模拟器中，当声源移动速度调到 1.2 Ma（超音速）时，声波的形状呈现为？',
            options: ['在声源前方被极度压缩的圆形', '对称分布的同心圆', '以声源为顶点的圆锥形包络线（激波面）', '声波完全消失，听不到任何声音'],
            correctAnswer: 2,
            explanation: '超音速下，由于声源运动速度快于声波传播速度，声波叠加构成一个以声源为顶点、向后延伸的圆锥形激波面（即马赫锥）。'
          }
        ]
      }
    },
    {
      id: 'closed-circuit-ohm',
      name: '闭合电路欧姆定律',
      grade: 'senior',
      category: 'electricity',
      description: '探讨闭合电路中电动势、内阻与外电阻的分压规律，在右侧同步绘制经典的 U-I 工作曲线并追踪交点。',
      component: ClosedCircuitOhm,
      theory: {
        title: '闭合电路欧姆定律与路端电压',
        formula: '总电流: I = E / (R + r)   |   路端电压: U外 = E - I·r = I·R',
        description: '闭合电路欧姆定律描述了包含电源的完整闭合电路中的电流规律。电源电动势（E）在电路闭合时，一部分分配在电源外部的电阻（外电压/路端电压 U），另一部分分担在电源自身的内阻（内电压 Ir）。',
        points: [
          '电动势（E）：反映电源把其他形式的能量转化为电能本领的物理量，数值等于电路断开时的路端电压。',
          '内阻（r）：电源内部介质的电阻。电流通过时，会在电源内部产生发热和内电压降（Ir）。',
          '路端电压（U）：即外电路两端的电压。随外电阻 R 的减小，电流 I 增大，内电压 Ir 增大，从而导致路端电压 U 降低。',
          'U-I 图像特征：纵轴截距等于电动势 E，横轴截距等于短路电流 I短 = E/r，斜率绝对值代表电源内阻 r（r = |dU/dI|）。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在闭合电路中，当滑动变阻器的阻值 R 逐渐减小时，路端电压 U 和电路总电流 I 的变化是？',
            options: ['U 增大，I 减小', 'U 减小，I 增大', 'U 和 I 都增大', 'U 和 I 都减小'],
            correctAnswer: 1,
            explanation: 'R 减小导致电路总电阻 (R+r) 减小。根据闭合电路欧姆定律，电流 I = E / (R+r) 增大。因为内阻分压 Ur = I * r 随之增大，所以外电压（路端电压） U = E - Ir 减小。'
          },
          {
            question: '若某个干电池的电动势 E = 1.5V，内阻 r = 0.5Ω，当将其两端直接用导线短路（即外电阻 R ≈ 0）时，短路电流是？',
            options: ['0.75A', '1.5A', '3.0A', '无限大'],
            correctAnswer: 2,
            explanation: '短路时外电阻 R = 0。根据公式 I = E / (R + r)，此时短路电流 I短 = E / r = 1.5V / 0.5Ω = 3.0A。短路电流非常大，容易烧毁电源。'
          }
        ]
      }
    },
    {
      id: 'double-slit',
      name: '双缝干涉实验',
      grade: 'senior',
      category: 'light',
      description: '模拟光的波动干涉。输入特定纳米波长（色轮），展示双缝衍射波动干涉环，并渲染屏幕彩色明暗条纹。',
      component: DoubleSlitInterference,
      theory: {
        title: '双缝干涉条纹间距规律',
        formula: '条纹间距: Δx = (L / d) · λ (L 为缝屏距离, d 为双缝间距, λ 为光波长)',
        description: '英国物理学家托马斯·杨用双缝干涉实验首次证实了光具有波动性。一束单色激光照射在紧邻的双缝上，双缝作为两个相干声源（振动情况完全一致）向右辐射波。在屏幕上，由于两列波的光程差不同，相长叠加产生亮条纹，相消叠加产生暗条纹，形成明暗相间的干涉图样。',
        points: [
          '相干条件：两列光波必须频率相同、相位差恒定、振动方向一致。',
          '明暗条件：光程差是波长整数倍（ΔS = kλ）时为明条纹；光程差是半波长的奇数倍（ΔS = (2k+1)λ/2）时为暗条纹。',
          '条纹宽度（Δx）：亮条纹之间的间距与缝屏距离 L 成正比，与双缝间距 d 成反比，与光波长 λ 成正比。',
          '光谱规律：红光波长长，干涉条纹最宽；蓝紫光波长短，干涉条纹最窄。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在双缝干涉实验中，若想增加光屏上明暗条纹之间的距离（条纹变宽），可采取什么方法？',
            options: ['增大双缝之间的间距 d', '减小双缝到光屏的距离 L', '改用波长更长的红色激光', '改用波长更短的蓝色激光'],
            correctAnswer: 2,
            explanation: '根据公式 Δx = (L/d)*λ。要使 Δx 变大，可以通过增大 L、减小 d，或者增大波长 λ（红光波长长于蓝光）。因此改用红色激光可以加宽条纹。'
          },
          {
            question: '双缝干涉实验在光屏上产生明暗相间条纹的物理原因是因为两列光波？',
            options: ['在不同位置发生了强弱叠加（相干相长与相消）', '相互碰撞弹开', '在缝处发生了化学反应', '被空气吸收了'],
            correctAnswer: 0,
            explanation: '双缝干涉实质上是波的相干叠加现象。从双缝发出的两列相干波在空间传播，当它们在光屏某处波峰与波峰相遇时，振动加强（明条纹）；当波峰与波谷相遇时，振动减弱抵消（暗条纹）。'
          }
        ]
      }
    },
    {
      id: 'ideal-gas',
      name: '理想气体状态方程',
      grade: 'senior',
      category: 'heat',
      description: '模拟理想气体微观分子动理论。支持手柄拖动活塞改变体积，调整温度与分子数，展示 PV/T 恒定图像。',
      component: IdealGasLaw,
      theory: {
        title: '理想气体状态方程微观与宏观',
        formula: '理想状态方程: P·V = N·k_B·T   |   微观压强: P = 2/3 · n · 平均动能_Ek',
        description: '理想气体状态方程描述了理想气体在热力学平衡状态下的压强（P）、体积（V）和温度（T）之间的宏观代数关系。在微观上，理想气体是由大量无规则运动的碰撞球形分子组成，压强的本质是大量分子在与器壁碰撞时产生的平均动量冲量和。',
        points: [
          '玻意耳定律：温度 T 恒定时，压强 P 与体积 V 成反比（PV = C，图像为双曲线）。',
          '盖·吕萨克定律：压强 P 恒定时，体积 V 与热力学温度 T 成正比。',
          '压强的微观实质：大量气体分子撞击容器壁的频繁冲撞。压强正比于分子数密度（n = N/V）以及分子的平均动能（决定于温度 T）。',
          '温度的微观实质：物体内部所有分子做无规则热运动的**平均动能**的度量（T 越高，粒子飞行速度越快）。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '若保持容器体积 V 不变，将温度 T 调高，则容器压强 P 会？',
            options: ['保持不变', '增大，因为分子热运动变剧烈，撞击器壁冲力增大', '减小，因为分子运动变快后容易逃逸', '无法确定'],
            correctAnswer: 1,
            explanation: '体积不变时，温度升高，微观分子热运动速度加快，撞击容器壁的冲量变大，且单位时间内撞击频率升高，因而宏观压强变大。'
          },
          {
            question: '在理想气体模拟器中，向左侧推活塞（减小体积 V）同时保持温度 T 恒定，压强计指针将？',
            options: ['向上偏转（压强增大）', '向下偏转（压强减小）', '指在 0 位置不变', '来回剧烈震荡'],
            correctAnswer: 0,
            explanation: '温度恒定意味着分子的平均运动速率不变。当体积 V 变小时，容器分子密度急剧变密，分子撞击器壁的频率升高，宏观上表现为压强增大。这符合玻意耳定律 (P ∝ 1/V)。'
          }
        ]
      }
    },
    {
      id: 'hollow-ball-collision',
      name: '球壳内小球多阶段碰撞',
      grade: 'senior',
      category: 'motion',
      description: '模拟经典力学碰撞问题。分析球壳被竖直上抛并与天花板发生弹性碰撞后，内部小球在球壳内的多阶段往复完全弹性碰撞以及最终着陆的完整解析规律。',
      component: HollowBallCollision,
      theory: {
        title: '球壳内小球弹性碰撞模型与规律',
        formula: '碰撞反弹 v_s^+ = \\alpha v_s^- + (1-\\alpha)v_b^-  |  落地速度 v_{\\text{land}} = \\sqrt{v_s^2 + 2gy}',
        description: '本实验探究完全弹性碰撞的动量守恒与机械能守恒。当球壳在上升时碰撞天花板并原速率反弹，小球在内部与球壳形成相对运动，产生多阶段往复弹性碰撞，体现了力学中对称性、周期性及能量守恒的统一。',
        points: [
          '第一阶段：自由上抛直至球壳顶端与天花板发生碰撞。在此阶段球壳与小球相对静止。',
          '第二阶段：碰撞天花板后，球壳与小球产生 2 m/s 的相对速度。经过 0.1s 发生首次内部碰撞，从而推导小球直径 d = 0.05 m。',
          '第三阶段：内部小球与球壳发生规律性弹性碰撞，时间间隔恒为 0.1s。利用第 8 次碰撞前速度可求得质量比 m/M = 3.0。',
          '落地速度：通过顺次递推第 11 次碰撞后的状态（y_s=0.35m, v_s=-9m/s），应用机械能守恒，得到球壳底部落地时的速度为 9.38 m/s。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在默认参数下，球壳上抛反弹后经过 0.1s 小球与球壳发生碰撞，求小球的直径 d 是多少？',
            options: ['0.02 m', '0.05 m', '0.08 m', '0.10 m'],
            correctAnswer: 1,
            explanation: '球壳碰撞天花板后速度变为 -1 m/s (向下)，小球仍为 1 m/s (向上)，相对速度为 2 m/s。经过 0.1s 发生内部碰撞，相对位移为 D - d = v_rel * dt = 2 * 0.1 = 0.2 m。因为球壳直径 D = 0.25 m，故小球直径 d = 0.25 - 0.2 = 0.05 m。'
          },
          {
            question: '小球与球壳发生完全弹性碰撞后，在下落的重力场中，它们相继两次碰撞的时间间隔为？',
            options: ['0.05 s', '0.10 s', '0.15 s', '0.20 s'],
            correctAnswer: 1,
            explanation: '完全弹性碰撞中，在重力场（两物体加速度均为 g，无相对加速度）下，每次碰撞后的相对速度大小守恒（仍为 2 m/s），且相对运动位移大小恒为 D - d = 0.20 m，因此每次碰撞的时间间隔恒为 dt = (D-d)/v_rel = 0.20 / 2 = 0.10 s。'
          },
          {
            question: '若球壳底端回到地面时作为落地，已知第 11 次碰后球壳底高 0.35 m，碰后速度为 -9 m/s，求此时球壳底部的落地速度？',
            options: ['9.00 m/s', '9.22 m/s', '9.38 m/s', '9.55 m/s'],
            correctAnswer: 2,
            explanation: '第 11 次碰撞后球壳底端高度为 0.35 m，初速度为 -9 m/s (向下)，在只受重力的情况下回落到地面 y_s = 0 m。根据机械能守恒定律有：v_land = √(v_s^2 + 2*g*y_s) = √(9^2 + 2*10*0.35) = √88 ≈ 9.38 m/s。'
          }
        ]
      }
    },
    // --- JUNIOR HIGH SCHOOL CHEMISTRY SIMULATIONS ---
    {
      id: 'kclo3-oxygen',
      name: '氯酸钾制取氧气',
      grade: 'junior',
      category: 'chem_gas',
      subject: 'chemistry',
      description: '通过加热氯酸钾与二氧化锰（催化剂）制取氧气，采用排水集气法收集气体，展示粒子受热分解并释放氧气分子的过程。',
      component: KClO3OxygenSim,
      textbook: {
        page: '人教版九年级化学上册 第37页',
        goal: '学习实验室制取氧气的方法，掌握分解反应与催化剂的作用',
        apparatus: '铁架台、试管、单孔橡皮塞、导管、集气瓶、水槽、酒精灯、氯酸钾、二氧化锰',
        steps: [
          '1. 仪器连接：检查装置气密性',
          '2. 装药：将氯酸钾与二氧化锰混合均匀装入试管，试管口略向下倾斜',
          '3. 固定：将试管固定在铁架台上',
          '4. 点燃：点燃酒精灯，先预热，然后集中在药品部位加热',
          '5. 收集：待导管口气泡连续均匀冒出时开始收集',
          '6. 撤导管：实验完毕先将导管撤离水面',
          '7. 熄灯：最后熄灭酒精灯'
        ],
        phenomenon: '试管中固体加热后熔化并产生气泡，集气瓶内水被排出，收集到无色气体；该气体能使带火星的木条复燃',
        equation: '2KClO₃ ➔(MnO₂/△) 2KCl + 3O₂↑',
        conclusion: '氯酸钾在二氧化锰催化下受热分解可制得氧气。反应完毕需先撤导管后熄灯以防倒吸'
      },
      theory: {
        title: '氯酸钾的催化热分解',
        formula: '2KClO₃ ➔(加热/MnO₂) 2KCl + 3O₂↑',
        description: '氯酸钾在加热条件下分解速度缓慢，加入黑色固体二氧化锰能显著加快其分解速率。二氧化锰在此反应中作为催化剂，自身的质量和化学性质在反应前后不发生改变。',
        points: [
          '排水集气法：利用氧气不易溶于水且不与水反应的性质，排开水收集纯净的氧气。',
          '催化剂特征：改变化学反应速率，而自身的质量和化学性质在反应前后均不改变。',
          '反应类型：本反应属于分解反应，即由一种反应物生成多种生成物的反应。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在加热氯酸钾制取氧气实验中，试管口稍微向下倾斜的原因是？',
            options: ['防止产生的氧气逸出', '防止试管口冷凝水倒流炸裂试管', '使反应物受热更均匀', '方便连接导管'],
            correctAnswer: 1,
            explanation: '固体原料中可能含有的微量水分受热蒸发，并在试管口冷凝。若试管口向上倾斜，冷凝水会倒流至灼热的试管底部导致试管爆裂。'
          },
          {
            question: '二氧化锰在氯酸钾受热分解的实验中起什么作用？',
            options: ['作为反应物提供氧原子', '提高氧气的总产量', '作为催化剂改变化学反应速率', '降低反应所需的温度并作为溶剂'],
            correctAnswer: 2,
            explanation: '二氧化锰是该反应的催化剂，只能加快反应速率，不能增加生成物的总产量。'
          }
        ]
      }
    },
    {
      id: 'iron-oxygen',
      name: '铁丝在氧气中燃烧',
      grade: 'junior',
      category: 'chem_burning',
      subject: 'chemistry',
      description: '观察细铁丝在纯氧中剧烈燃烧、火星四射、生成黑色固体的微观反应与碰撞过程，验证氧化反应剧烈程度与浓度的关系。',
      component: IronOxygenSim,
      textbook: {
        page: '人教版九年级化学上册 第34页',
        goal: '探究铁丝在氧气中的燃烧现象，认识氧化反应的剧烈程度',
        apparatus: '集气瓶、坩埚钳、酒精灯、细铁丝、火柴、氧气、水或细沙',
        steps: [
          '1. 准备：集气瓶底装少量水或铺一层细沙',
          '2. 绕制：将细铁丝绕成螺旋状，末端系一根火柴',
          '3. 点燃：引燃火柴，待火柴快燃尽时，缓缓伸入盛有氧气的集气瓶中',
          '4. 观察：观察铁丝燃烧的现象'
        ],
        phenomenon: '铁丝在氧气中剧烈燃烧，火星四射，放出大量的热，生成黑色固体',
        equation: '3Fe + 2O₂ ➔(点燃) Fe₃O₄',
        conclusion: '铁在纯氧中可发生剧烈燃烧。瓶底装水或沙是为防止高温熔融物溅落炸裂瓶底'
      },
      theory: {
        title: '铁与氧气的剧烈氧化',
        formula: '3Fe + 2O₂ ➔(点燃) Fe₃O₄',
        description: '铁丝在空气中不能燃烧（仅红热），但在纯氧中可以剧烈燃烧。这是因为纯氧中氧气分子的数密度极高，与铁原子的碰撞频率及成功反应的概率急剧增加。',
        points: [
          '燃烧现象：剧烈燃烧，火星四射，放出大量的热，生成一种黑色固体（四氧化三铁）。',
          '集气瓶安全：底部应预先装入少量水或铺一层细沙，防止燃烧产生的高温熔融物溅落炸裂集气瓶底。',
          '对比性：本实验直观体现了反应物的浓度（氧气浓度）会显著影响化学反应的剧烈程度。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '细铁丝在氧气中燃烧时，在集气瓶底部铺一层细沙或放少量水的作用是？',
            options: ['吸收有害气体SO₂', '使铁丝燃烧得更旺', '防止高温熔融物溅落炸裂瓶底', '作为反应物参与反应'],
            correctAnswer: 2,
            explanation: '铁丝燃烧产生的四氧化三铁熔融物温度极高，溅落到瓶底会使玻璃局部受热不均而碎裂。铺细沙或放水起缓冲和降温作用。'
          },
          {
            question: '铁丝在空气中不能燃烧，但在纯氧中却可以剧烈燃烧，这说明？',
            options: ["空气中的氧气化学性质不同", "燃烧剧烈程度与氧气浓度有关", "铁在低温下才能在空气中反应", "铁丝在空气中不易导热"],
            correctAnswer: 1,
            explanation: '氧气浓度越高，可燃物与氧气接触面积和分子碰撞几率越大，燃烧越剧烈。'
          }
        ]
      }
    },
    {
      id: 'phosphorus-oxygen',
      name: '红磷在氧气中燃烧',
      grade: 'junior',
      category: 'chem_burning',
      subject: 'chemistry',
      description: '模拟红磷在氧气中燃烧释放大量白烟的微观反应过程，展示五氧化二磷固体小颗粒的生成。',
      component: PhosphorusOxygenSim,
      textbook: {
        page: '人教版九年级化学上册 第27页',
        goal: '认识红磷在氧气中燃烧的现象，理解反应产物',
        apparatus: '集气瓶、燃烧匙、酒精灯、红磷、氧气',
        steps: [
          '1. 取药：用燃烧匙取少量红磷',
          '2. 点燃：在酒精灯上加热红磷至燃烧',
          '3. 反应：将燃烧的红磷迅速伸入盛有氧气的集气瓶中',
          '4. 观察：观察红磷燃烧的现象及生成的白烟'
        ],
        phenomenon: '红磷剧烈燃烧，发出耀眼的白光，放出热量，生成大量的白烟',
        equation: '4P + 5O₂ ➔(点燃) 2P₂O₅',
        conclusion: '红磷与氧气点燃生成五氧化二磷固体小颗粒（白烟）'
      },
      theory: {
        title: '磷的燃烧与烟的本质',
        formula: '4P + 5O₂ ➔(点燃) 2P₂O₅',
        description: '红磷在纯氧中剧烈燃烧，发出耀眼的白光，放出热量，并生成浓厚的白烟。这里的‘白烟’实际上是反应生成的五氧化二磷（P₂O₅）固体小颗粒悬浮在气体中形成的。',
        points: [
          '烟与雾的区别：化学中‘烟’指固体小颗粒分散在气体中，‘雾’指小液滴分散在气体中。',
          '测定空气中氧气含量的经典实验就是利用红磷燃烧消耗氧气、生成固体五氧化二磷使系统压强减小的原理。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '红磷在氧气中燃烧产生的‘白烟’，其主要成分是？',
            options: ['五氧化二磷固体小颗粒', '水蒸气', '二氧化碳气体', '磷酸小液滴'],
            correctAnswer: 0,
            explanation: '白烟是生成的固体产物五氧化二磷（P₂O₅）粉末悬浮在空气中形成的。'
          }
        ]
      }
    },
    {
      id: 'sulfur-oxygen',
      name: '硫在氧气中燃烧',
      grade: 'junior',
      category: 'chem_burning',
      subject: 'chemistry',
      description: '观察硫磺在氧气中燃烧发出明亮的蓝紫色火焰、生成二氧化硫刺激性气体的微观反应现象。',
      component: SulfurOxygenSim,
      textbook: {
        page: '人教版九年级化学上册 第33页',
        goal: '认识硫在空气和氧气中燃烧的差异，掌握酸性氧化物污染的吸收方法',
        apparatus: '集气瓶（装有水）、燃烧匙、酒精灯、硫粉、氧气',
        steps: [
          '1. 取药：用燃烧匙取少量硫粉',
          '2. 空气中燃：在酒精灯上引燃硫粉，观察在空气中的火焰',
          '3. 氧气中燃：将燃烧的硫粉缓缓伸入盛有氧气的集气瓶中，观察火焰颜色',
          '4. 观察与吸收：观察生成的刺激性气体，并用瓶底的水吸收'
        ],
        phenomenon: '硫在空气中燃烧发出微弱的淡蓝色火焰；在氧气中燃烧发出明亮的蓝紫色火焰，放出热量，生成有刺激性气味的气体',
        equation: 'S + O₂ ➔(点燃) SO₂',
        conclusion: '硫在氧气中比空气中燃烧更剧烈。二氧化硫有害，瓶底的水可将其吸收'
      },
      theory: {
        title: '硫的燃烧及吸收防污',
        formula: 'S + O₂ ➔(点燃) SO₂',
        description: '硫在空气中燃烧发出微弱的淡蓝色火焰，但在纯氧中剧烈燃烧，发出明亮的蓝紫色火焰，生成无色、有刺激性气味的气体二氧化硫（SO₂）。',
        points: [
          '刺激性气体：SO₂是一种大气污染物，易溶于水并与水反应生成亚硫酸。',
          '环保措施：实验中集气瓶底通常需要装少量水或NaOH溶液以吸收生成的SO₂气体，防止其逸出污染空气。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '硫在纯氧中燃烧的火焰颜色为？',
            options: ['淡蓝色', '明亮的蓝紫色', '耀眼的白光', '黄色'],
            correctAnswer: 1,
            explanation: '硫在空气中燃烧是淡蓝色火焰，在纯氧中是明亮的蓝紫色火焰。'
          }
        ]
      }
    },
    {
      id: 'co2-naoh',
      name: '二氧化碳与碱溶液反应',
      grade: 'junior',
      category: 'chem_acidbase',
      subject: 'chemistry',
      description: '模拟二氧化碳气体与氢氧化钠溶液的酸碱反应，展示气体分子被吸收引起的系统压强降低及橡皮膜/气球的变化。',
      component: Co2NaohSim,
      textbook: {
        page: '人教版九年级化学下册 第56页',
        goal: '验证二氧化碳与氢氧化钠溶液的反应，理解气压差的变化',
        apparatus: '软塑料瓶/烧瓶（充满二氧化碳）、注射器、氢氧化钠溶液、水',
        steps: [
          '1. 密闭：在盛有二氧化碳的塑料瓶或烧瓶中装好气球或接上注射器',
          '2. 注入：通过注射器向瓶内注入氢氧化钠溶液',
          '3. 振荡：充分振荡塑料瓶，观察瓶身形状或气球的变化',
          '4. 对比：用等体积的水做对照实验'
        ],
        phenomenon: '注入氢氧化钠溶液后振荡，塑料瓶迅速变瘪（或烧瓶内气球膨胀），而注入等体积水的塑料瓶变化不明显',
        equation: 'CO₂ + 2NaOH ➔ Na₂CO₃ + H₂O',
        conclusion: '二氧化碳能与氢氧化钠发生化学反应，消耗气体导致瓶内气压降低'
      },
      theory: {
        title: '酸性氧化物与碱反应',
        formula: 'CO₂ + 2NaOH ➔ Na₂CO₃ + H₂O',
        description: '二氧化碳作为非金属氧化物（酸性氧化物），能与氢氧化钠反应生成可溶性的碳酸钠和水。反应导致密封容器内气体分子数骤减，从而引起容器内压强降低。',
        points: [
          '压强变化指示：该反应无明显外观现象。但反应后气体体积剧烈收缩，产生的瓶内负压能引起气球膨胀或塑料瓶变瘪。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '将NaOH溶液注入盛满CO₂的密闭烧瓶中，烧瓶内的气球会膨胀。这是因为？',
            options: ['反应产生了新的气体', '反应放热使气体膨胀', 'CO₂气体被反应吸收，瓶内气压降低', 'NaOH溶液挥发'],
            correctAnswer: 2,
            explanation: 'CO₂与NaOH反应生成Na₂CO₃和水，气态分子被消耗，使得密闭烧瓶内部气压低于外部大气压，从而使气球外部受压膨胀。'
          }
        ]
      }
    },
    {
      id: 'electrolysis-water',
      name: '电解水实验',
      grade: 'junior',
      category: 'chem_gas',
      subject: 'chemistry',
      description: '通过直流电作用使水分子分解，展示阳极产生氧气、阴极产生氢气且体积比为1:2的电解规律。',
      component: ElectrolysisWaterSim,
      textbook: {
        page: '人教版九年级化学上册 第79页',
        goal: '通过电解水实验探究水的组成，验证分子的可分性',
        apparatus: '水电解器（U型管或霍夫曼电解器）、直流电源、导线、水、稀硫酸/硫酸钠（作导电介质）',
        steps: [
          '1. 注液：向水电解器中注满含有少量稀硫酸或硫酸钠的水',
          '2. 接线：连接直流电源，阴极接负极，阳极接正极',
          '3. 通电：接通直流电源，观察两电极上的现象以及玻璃管内气体的体积变化',
          '4. 检验：通电一段时间后，分别用带火星木条和燃着木条检验产生的气体'
        ],
        phenomenon: '接通电源后，两极均产生气泡，阴极产生气泡速度较快；一段时间后，阴极与阳极产生的气体体积比约为2:1；阴极气体能燃烧，阳极气体能使带火星木条复燃',
        equation: '2H₂O ➔(通电) 2H₂↑ + O₂↑',
        conclusion: '水在直流电作用下分解生成氢气和氧气，说明水是由氢元素和氧元素组成的'
      },
      theory: {
        title: '水分子的电化学分解',
        formula: '2H₂O ➔(通电) 2H₂↑ + O₂↑',
        description: '水分子在直流电的作用下发生氧化还原反应。在阴极（负极），氢离子获得电子被还原为氢气；在阳极（正极），氢氧根离子失去电子被氧化为氧气。',
        points: [
          '正氧负氢：电解水产生的氢气和氧气的体积比约为 2:1。',
          '导电介质：纯水导电性极差，实验时常往水中加入少量的稀硫酸或NaOH，以增强水的导电性。',
          '结论：水是由氢元素和氧元素组成的（化学反应中分子可分，原子不可分）。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在电解水实验中，连接电源负极的一端产生的气体是？',
            options: ['氧气', '氢气', '二氧化碳', '水蒸气'],
            correctAnswer: 1,
            explanation: '电解水时，‘正氧负氢’，连接负极的一端产生的是氢气（H₂）。'
          },
          {
            question: '电解水实验中产生的氢气与氧气体积比为？',
            options: ['1 : 8', '8 : 1', '1 : 2', '2 : 1'],
            correctAnswer: 3,
            explanation: '体积比为 2:1，质量比为 1:8。记住‘正氧负氢，氢二氧一’。'
          }
        ]
      }
    },
    {
      id: 'salt-purification',
      name: '粗盐中难溶杂质的去除',
      grade: 'junior',
      category: 'chem_solution',
      subject: 'chemistry',
      description: '全流程模拟粗盐提纯的三个经典操作：溶解、过滤和蒸发结晶，展示悬浮泥沙与食盐离子的分离过程。',
      component: SaltPurificationSim,
      textbook: {
        page: '人教版九年级化学下册 第72页',
        goal: '掌握过滤和结晶的基本操作，去除粗盐中的不溶性杂质',
        apparatus: '烧杯、玻璃棒、铁架台（带铁圈）、漏斗、滤纸、蒸发皿、酒精灯、坩埚钳、石棉网、粗盐、水',
        steps: [
          '1. 溶解：称取粗盐加入烧杯，加水并用玻璃棒搅拌加速溶解',
          '2. 过滤：组装过滤装置，折叠滤纸贴紧漏斗，沿玻璃棒将悬浊液引流过滤',
          '3. 蒸发：将滤液倒入蒸发皿，用酒精灯加热并用玻璃棒不断搅拌，出现较多固体时停止加热，利用余热蒸干'
        ],
        phenomenon: '溶解后得到浑浊液体；过滤后滤纸上留有泥沙等黑色固体，烧杯中得到澄清滤液；蒸发加热过程中，蒸发皿中析出白色晶体',
        equation: 'NaCl(水溶液) ➔(加热蒸发) NaCl(固体) + H₂O(气)',
        conclusion: '通过溶解、过滤可去除粗盐中的难溶性杂质，利用蒸发结晶可回收得到食盐晶体'
      },
      theory: {
        title: '混合物分离——结晶与过滤',
        formula: 'NaCl(水溶液) ➔(加热蒸发) NaCl(固体) + H₂O(气)',
        description: '粗盐中混有泥沙等不溶性杂质。通过溶解可将可溶的氯化钠转化为自由移动的离子，再通过过滤将大颗粒的泥沙拦截，最后通过蒸发减少溶剂，使食盐晶体重新析出。',
        points: [
          '溶解：搅拌可以加速溶解速率，但不能增加氯化钠的最大溶解度。',
          '过滤要点：‘一贴二低三靠’。滤纸贴紧漏斗；滤纸边缘低于漏斗边缘，液面低于滤纸边缘；烧杯嘴靠引流棒，棒靠三层滤纸，漏斗下端靠烧杯壁。',
          '蒸发：要用玻璃棒不断搅拌防止液滴飞溅，当出现较多固体时即停止加热。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在粗盐提纯的过滤操作中，玻璃棒的作用是？',
            options: ['加速溶解', '引流液体', '防止局部过热液滴飞溅', '转移固体'],
            correctAnswer: 1,
            explanation: '过滤时，待过滤液体顺着玻璃棒慢慢注入漏斗中，防止液体溅出或冲破滤纸，起引流作用。'
          },
          {
            question: '在蒸发结晶操作中，何时应该停止使用酒精灯加热？',
            options: ['溶液刚刚开始沸腾时', '水完全蒸干后', '蒸发皿中出现较多固体时', '溶液颜色发生改变时'],
            correctAnswer: 2,
            explanation: '当蒸发皿中析出较多固体时应当熄灭酒精灯，利用蒸发皿的余热将水分蒸干，防止食盐晶体因过度受热而飞溅。'
          }
        ]
      }
    },
    {
      id: 'oxygen-lab',
      name: '氧气的实验制取与性质',
      grade: 'junior',
      category: 'chem_gas',
      subject: 'chemistry',
      description: '先加热分解氯酸钾制取并收集一瓶氧气，再自主选择铁丝、红磷或硫粉放入瓶内燃烧，完成性质验证。',
      component: OxygenLabSim,
      textbook: {
        page: '人教版九年级化学上册 第38页',
        goal: '学习实验室制取氧气的原理和性质验证的完整操作',
        apparatus: '大试管、铁架台、带导管的单孔塞、集气瓶、水槽、酒精灯、燃烧匙、氯酸钾、二氧化锰、铁丝、红磷',
        steps: [
          '1. 组装与检查：组装实验装置，检查气密性',
          '2. 加热制气：装药后固定，加热并将产生的气体用排水法收集到集气瓶中',
          '3. 性质验证：将铁丝或红磷装入燃烧匙点燃，迅速伸入收集好氧气的集气瓶中',
          '4. 观察记录：观察不同可燃物在氧气中的燃烧现象'
        ],
        phenomenon: '排水法收集到多瓶无色气体；燃着的铁丝或红磷在该气体中剧烈燃烧，反应程度比在空气中强烈得多',
        equation: '2KClO₃ ➔(MnO₂/△) 2KCl + 3O₂↑',
        conclusion: '本实验融合了氧气的实验室制取与性质验证，深化了对氧气助燃性的认识'
      },
      theory: {
        title: '氧气的发生与性质验证',
        formula: '2KClO₃ ➔ 2KCl + 3O₂↑  |  燃烧: M + O₂ ➔ 氧化物',
        description: '本实验是氧气的典型制备和性质测定综合实验。第一步通过热分解氯酸钾获得纯氧，并观察排水法收集气体的物理过程；第二步验证高浓度氧气作为助燃剂的强烈化学反应活性。',
        points: [
          '制取和收集属于‘发生装置与收集装置’设计。',
          '性质验证展现了可燃物与氧气接触面积和分子碰撞几率对反应速率的决定作用。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '排水集气法开始收集氧气的最佳时机是？',
            options: ['导管口一有气泡冒出时立即收集', '酒精灯点燃后立即收集', '导管口气泡连续且均匀冒出时', '试管温度达到400度时'],
            correctAnswer: 2,
            explanation: '刚开始受热排出的气泡主要是试管内部受热膨胀的空气。当气泡连续、均匀冒出时，说明排出的已是纯净氧气，此时才可以开始收集。'
          }
        ]
      }
    },
    {
      id: 'co2-lab',
      name: '二氧化碳的实验制取与性质',
      grade: 'junior',
      category: 'chem_gas',
      subject: 'chemistry',
      description: '以石灰石与稀盐酸为原料制取二氧化碳，并验证其不助燃、密度大以及使紫色石蕊试液变红的酸碱化学性质。',
      component: Co2LabSim,
      textbook: {
        page: '人教版九年级化学上册 第113页',
        goal: '学习实验室制取二氧化碳并验证其主要化学和物理性质',
        apparatus: '锥形瓶、长颈漏斗、集气瓶、导管、烧杯、石蕊试液、蜡烛、石灰石、稀盐酸',
        steps: [
          '1. 发生装置：将石灰石装入锥形瓶，塞好双孔塞，长颈漏斗下端需伸入液面以下',
          '2. 收集气体：向漏斗注入稀盐酸，用向上排空气法收集气体，用燃着木条放在瓶口验满',
          '3. 性质验证：将二氧化碳缓缓倒入装有高低蜡烛的烧杯中；或通入紫色石蕊试液中'
        ],
        phenomenon: '锥形瓶内产生大量气泡，石灰石逐渐溶解；倒入烧杯后，下层蜡烛先熄灭，上层蜡烛后熄灭；通入紫色石蕊试液后，试液变红色',
        equation: 'CaCO₃ + 2HCl ➔ CaCl₂ + H₂O + CO₂↑  |  CO₂ + H₂O ⇄ H₂CO₃',
        conclusion: '实验室常用石灰石与稀盐酸反应制取二氧化碳。二氧化碳密度比空气大，不能燃烧也不支持燃烧，能与水反应生成酸'
      },
      theory: {
        title: '碳酸盐与酸反应及酸碱反应',
        formula: 'CaCO₃ + 2HCl ➔ CaCl₂ + H₂O + CO₂↑  |  CO₂ + H₂O ⇄ H₂CO₃',
        description: '大理石或石灰石（主要成分CaCO₃）与稀盐酸（主要成分HCl）在常温下发生反应，生成氯化钙、水和二氧化碳气体。将气体通入紫色石蕊中，二氧化碳与水反应生成不稳定的碳酸（H₂CO₃），碳酸电离出氢离子使石蕊变红。',
        points: [
          '二氧化碳不支持燃烧且密度比空气大，可以像倾倒液体一样将其倒入烧杯中，扑灭高低不同的蜡烛。',
          '石蕊变红的本质是二氧化碳与水反应生成的碳酸显酸性，而非二氧化碳本身使石蕊变色。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '通入CO₂后紫色石蕊试液变红，然后将该红色溶液进行加热，溶液会？',
            options: ['保持红色不变', '变成无色', '变回紫色', '变成蓝色'],
            correctAnswer: 2,
            explanation: '碳酸很不稳定，受热易分解成二氧化碳和水。加热后碳酸消失，溶液酸性减弱，因此红色溶液重新变回紫色。'
          }
        ]
      }
    },
    {
      id: 'metal-reactions',
      name: '金属的物理性质与某些化学性质',
      grade: 'junior',
      category: 'chem_metal',
      subject: 'chemistry',
      description: '比较铜、铁、锌、镁四种金属与稀盐酸的置换反应。从微观碰撞角度观察不同金属释放氢气的速率，排列金属活动性顺序。',
      component: MetalReactionsSim,
      textbook: {
        page: '人教版九年级化学下册 第9页',
        goal: '比较不同金属与稀酸的反应，探究并排列金属的活动性顺序',
        apparatus: '试管架、试管、稀盐酸、镁条、锌粒、铁片、铜片',
        steps: [
          '1. 准备：将四支试管放在试管架上，分别加入等量稀盐酸',
          '2. 投药：将镁、锌、铁、铜分别投入试管中',
          '3. 观察：观察各试管中产生气泡的快慢与剧烈程度'
        ],
        phenomenon: '镁条试管中反应极其剧烈，产生大量气泡；锌粒试管中反应剧烈，气泡均匀冒出；铁片试管中反应缓慢，有气泡产生且溶液逐渐变为浅绿色；铜片试管中无明显变化',
        equation: 'Mg + 2HCl ➔ MgCl₂ + H₂↑  |  Zn + 2HCl ➔ ZnCl₂ + H₂↑  |  Fe + 2HCl ➔ FeCl₂ + H₂↑',
        conclusion: '四种金属的活动性顺序由强到弱为：Mg > Zn > Fe > Cu'
      },
      theory: {
        title: '金属活动性顺序与置换反应',
        formula: 'Mg > Zn > Fe > (H) > Cu  |  M + 2HCl ➔ MCl₂ + H₂↑',
        description: '活性高于氢的活泼金属（镁、锌、铁）能够与稀酸（如稀盐酸、稀硫酸）发生置换反应，生成金属盐和氢气。反应速率快慢（氢气气泡产生的频繁度）反映了金属失去电子的能力大小（活动性强弱）。',
        points: [
          '镁反应最剧烈，瞬间产生大量气泡并放热。',
          '锌反应平稳，最适宜实验室制取氢气。',
          '铁反应较缓慢，有气泡产生且溶液由无色逐渐变为浅绿色（Fe²⁺）。',
          '铜活动性弱于氢，不与稀酸发生反应。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '将等质量的镁、锌、铁分别投入足量的稀盐酸中，反应速率最快的是？',
            options: ['镁 (Mg)', '锌 (Zn)', '铁 (Fe)', '三者一样快'],
            correctAnswer: 0,
            explanation: '在金属活动性顺序中，镁排在最前面，化学性质最活泼，与酸反应释放氢气的速率最快。'
          },
          {
            question: '在金属与酸的反应中，铜丝没有产生任何气泡，这说明？',
            options: ['铜的活动性比氢强', '铜是不活泼金属，活动性排在氢之后', '稀盐酸浓度太低', '铜原子不能失去电子'],
            correctAnswer: 1,
            explanation: '活动性顺序排在氢（H）之后的金属，不能置换出稀酸中的氢元素，因此不反应，无气泡产生。'
          }
        ]
      }
    },
    {
      id: 'combustion-conditions',
      name: '燃烧条件实验',
      grade: 'junior',
      category: 'chem_burning',
      subject: 'chemistry',
      description: '探究燃烧的三个必要条件。演示铜片上的白磷和红磷，以及水下白磷的对比实验，展示水下通入氧气后奇妙的‘水火相容’现象。',
      component: CombustionConditionsSim,
      textbook: {
        page: '人教版九年级化学上册 第128页',
        goal: '利用控制变量法探究燃烧条件',
        apparatus: '烧杯、铜片、白磷、红磷、热水、导管（通氧气）',
        steps: [
          '1. 装置组装：在烧杯中盛装热水，水下放入一小块白磷；杯口盖上薄铜片，铜片两端分别放白磷与红磷',
          '2. 对比观察：观察铜片上的白磷、红磷以及水下白磷的现象',
          '3. 水下通氧：用导管向水下的白磷通入氧气，观察现象'
        ],
        phenomenon: '铜片上的白磷燃烧产生大量白烟，红磷不燃烧；水下的白磷不燃烧；向水下白磷通入氧气后，水下白磷开始燃烧',
        equation: '4P + 5O₂ ➔(点燃) 2P₂O₅',
        conclusion: '燃烧必须满足三个条件：可燃物、与氧气接触、温度达到着火点。三者缺一不可'
      },
      theory: {
        title: '控制变量法探究燃烧条件',
        formula: '4P + 5O₂ ➔(点燃) 2P₂O₅  (着火点: 白磷 40℃, 红磷 240℃)',
        description: '燃烧需要同时满足三个条件：1.物质具有可燃性；2.可燃物与氧气（或空气）接触；3.温度达到可燃物的着火点。本实验通过控制温度（热水提供热量）和隔绝氧气（水下隔绝）来验证这三个条件。',
        points: [
          '铜片上的白磷：满足有氧气、温度达到着火点（40℃），因此剧烈燃烧产生大量白烟。',
          '铜片上的红磷：有氧气，但温度未达到着火点（240℃），不燃烧。',
          '水下的白磷：温度达到着火点，但隔绝氧气，不燃烧。一旦通入氧气，即在水下燃烧。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '向热水中的白磷通入氧气后，白磷在水下燃烧了，这说明？',
            options: ['水能变成可燃物', '水下温度比空气高', '燃烧需要氧气，且温度达到了着火点', '水中燃烧不产生污染'],
            correctAnswer: 2,
            explanation: '水下白磷温度已达着火点，缺少的只是氧气。通入氧气后，三个条件全部集齐，因此在水下也能发生燃烧。'
          }
        ]
      }
    },
    {
      id: 'nacl-solution',
      name: '一定溶质质量分数的溶液配制',
      grade: 'junior',
      category: 'chem_solution',
      subject: 'chemistry',
      description: '模拟使用天平称量食盐、量筒量取水、以及烧杯溶解配制氯化钠溶液的全过程，展示溶质在溶剂中的溶解扩散。',
      component: NaclSolutionSim,
      textbook: {
        page: '人教版九年级化学下册 第47页',
        goal: '学习配制一定溶质质量分数的溶液的实验技能与误差分析',
        apparatus: '托盘天平、量筒、胶头滴管、烧杯、玻璃棒、药匙、氯化钠、蒸馏水',
        steps: [
          '1. 计算：计算所需氯化钠固体的质量和水的体积',
          '2. 称量与量取：用天平称量固体，倒入烧杯；用量筒量取水，倒入烧杯',
          '3. 溶解：用玻璃棒不断搅拌，使氯化钠完全溶解',
          '4. 装瓶贴标签：把配制好的溶液装入试剂瓶中，贴上标签'
        ],
        phenomenon: '固体溶解在水中，白色颗粒逐渐变少直至完全消失，得到澄清透明的无色液体',
        equation: 'NaCl(固体) + H₂O ➔ NaCl(水溶液)',
        conclusion: '熟练掌握溶液配制步骤。视线读数偏差（俯视/仰视）及天平使用方法会对最终浓度造成偏差'
      },
      theory: {
        title: '一定溶质质量分数溶液的配制',
        formula: '溶质质量分数 = (溶质质量 / 溶液质量) × 100%',
        description: '溶液配制是实验室的基本定量操作。主要步骤包括：计算、称量（用天平称固体，用量筒量液体）、溶解。溶质质量分数用来量化溶液中溶质的相对含量。',
        points: [
          '称量：天平的使用遵循‘左物右码’。量筒量水时，视线应与凹液面的最低处保持水平。',
          '溶解：在烧杯中用玻璃棒不断搅拌，目的是加速溶解，并不会改变最终的溶质质量分数。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '在量取水的体积时，如果俯视读数（视线偏高），则实际量取的水体积会？',
            options: ['偏大', '偏小', '无影响', '无法确定'],
            correctAnswer: 1,
            explanation: '俯视读数时，读取的刻度线会高于实际液面，导致实际量取的水量偏少（偏小），从而导致配制出的溶液质量分数偏大。'
          }
        ]
      }
    },
    {
      id: 'acid-base',
      name: '酸碱的化学性质与中和反应',
      grade: 'junior',
      category: 'chem_acidbase',
      subject: 'chemistry',
      description: '滴加石蕊/酚酞指示剂观察酸碱溶液变色，并演示稀盐酸与氢氧化钠发生中和反应、形成中性水分子并释放热量的微观机理。',
      component: AcidBaseSim,
      textbook: {
        page: '人教版九年级化学下册 第7页 / 第60页',
        goal: '探究酸和碱的化学性质，理解酸碱中和反应的微观实质',
        apparatus: '烧杯、滴管、稀盐酸、氢氧化钠溶液、无色酚酞试液、紫色石蕊试液',
        steps: [
          '1. 指示剂变色：在稀盐酸和氢氧化钠中分别滴加石蕊和酚酞，观察颜色',
          '2. 中和反应：在烧杯中倒入氢氧化钠溶液，滴加酚酞使其显红色。用滴管缓缓滴入稀盐酸，边滴边搅拌，直至红色刚好退去'
        ],
        phenomenon: '石蕊遇盐酸变红，遇氢氧化钠变蓝；酚酞遇氢氧化钠变红，遇盐酸不变色；随着盐酸滴入，红色溶液颜色逐渐变浅，最后瞬间变成无色',
        equation: 'HCl + NaOH ➔ NaCl + H₂O  |  H⁺ + OH⁻ ➔ H₂O',
        conclusion: '酸碱中和反应的实质是酸中的 H⁺ 与碱中的 OH⁻ 结合生成 H₂O'
      },
      theory: {
        title: '酸碱中和反应与指示剂',
        formula: 'H⁺ + OH⁻ ➔ H₂O  |  HCl + NaOH ➔ NaCl + H₂O',
        description: '酸与碱发生中和反应的实质是 H⁺ 和 OH⁻ 相互结合生成中性的水分子的过程。指示剂（如石蕊、酚酞）分子在碰撞到不同浓度的 H⁺ 或 OH⁻ 时会改变呈色。',
        points: [
          '石蕊指示剂：遇酸变红，遇碱变蓝，在中性溶液中显紫色。',
          '酚酞指示剂：遇酸/中性不变色，遇碱变红色。',
          '中和反应属于复分解反应，通常伴随着热量的释放（放热反应）。'
        ]
      },
      quiz: {
        questions: [
          {
            question: '关于酸碱中和反应，下列说法正确的是？',
            options: ['中和反应的产物只有水', '中和反应在微观上是H⁺和OH⁻结合成H₂O的过程', '中和反应会导致溶液pH保持不变', '中和反应是吸热反应'],
            correctAnswer: 1,
            explanation: '中和反应实质上是酸电离出的氢离子与碱电离出的氢氧根离子相遇结合成水的过程，属于复分解反应且是放热反应。'
          }
        ]
      }
    }
  ];

  // Return schemas of active selected simulation
  const getSimSchema = (id: string): { schema: ParameterSchema[]; headers: string[]; recordFn: (p: any) => any[]; presets?: any[] } => {
    switch (id) {
      case 'sound-waves':
        return {
          schema: [
            { name: '波源频率', key: 'frequency', min: 200, max: 800, step: 10, unit: 'Hz' },
            { name: '声波振幅', key: 'amplitude', min: 1.0, max: 10.0, step: 0.5, unit: 'm' },
            { name: '波形选择', key: 'waveType', min: 0, max: 2, step: 1, unit: '' }
          ],
          headers: ['频率 (Hz)', '振幅', '波形类型'],
          recordFn: (p) => [p.frequency, p.amplitude, p.waveType === 0 ? '正弦波' : p.waveType === 1 ? '方波' : '三角波'],
          presets: [
            { name: '默认正弦波', params: { frequency: 440, amplitude: 5.0, waveType: 0 } },
            { name: '低频方波（低沉刺耳）', params: { frequency: 260, amplitude: 7.0, waveType: 1 } },
            { name: '高频三角波（尖锐金属）', params: { frequency: 750, amplitude: 3.5, waveType: 2 } }
          ]
        };
      case 'reflection-refraction':
        return {
          schema: [
            { name: '入射角度', key: 'incidentAngle', min: -85, max: 85, step: 1, unit: '°' },
            { name: '介质 1 折射率 n₁', key: 'n1', min: 1.0, max: 2.2, step: 0.05, unit: '' },
            { name: '介质 2 折射率 n₂', key: 'n2', min: 1.0, max: 2.2, step: 0.05, unit: '' }
          ],
          headers: ['入射角 θ₁ (°)', '介质 1 (n₁)', '介质 2 (n₂)', '折射角 θ₂ (°)'],
          recordFn: (p) => {
            const sin_t = (p.n1 / p.n2) * Math.sin(p.incidentAngle * Math.PI / 180);
            const isTotal = Math.abs(sin_t) > 1.0;
            const t_deg = isTotal ? '全反射' : (Math.asin(sin_t) * 180 / Math.PI).toFixed(1) + '°';
            return [p.incidentAngle, p.n1, p.n2, t_deg];
          },
          presets: [
            { name: '光从空气入水 (折射角变小)', params: { incidentAngle: 45, n1: 1.0, n2: 1.33 } },
            { name: '光从水入空气 (折射角变大)', params: { incidentAngle: 30, n1: 1.33, n2: 1.0 } },
            { name: '临界全反射 (水到空气)', params: { incidentAngle: 49, n1: 1.33, n2: 1.0 } }
          ]
        };
      case 'convex-lens':
        return {
          schema: [
            { name: '透镜焦距 f', key: 'f', min: 6, max: 18, step: 1, unit: 'cm' },
            { name: '物体物距 u', key: 'u', min: 2, max: 48, step: 0.5, unit: 'cm' }
          ],
          headers: ['焦距 f (cm)', '物距 u (cm)', '像距 v (cm)', '成像性质'],
          recordFn: (p) => {
            const f = p.f;
            const u = p.u;
            if (Math.abs(u - f) < 0.1) return [f, u, '∞', '不成像'];
            const v = (u * f) / (u - f);
            const sizeDesc = u > f ? (u > 2*f ? '倒立缩小实像' : u === 2*f ? '倒立等大实像' : '倒立放大实像') : '正立放大虚像';
            return [f, u, v.toFixed(1) + ' cm', sizeDesc];
          },
          presets: [
            { name: '照相机模式 (u > 2f 缩小的像)', params: { f: 10, u: 25 } },
            { name: '幻灯机模式 (f < u < 2f 放大的像)', params: { f: 10, u: 15 } },
            { name: '放大镜模式 (u < f 虚像)', params: { f: 12, u: 8 } }
          ]
        };
      case 'melting-curve':
        return {
          schema: [
            { name: '加热器功率', key: 'power', min: 100, max: 800, step: 50, unit: 'W' },
            { name: '冰块质量', key: 'mass', min: 50, max: 200, step: 10, unit: 'g' }
          ],
          headers: ['加热功率 (W)', '冰块质量 (g)', '能量转化相变记录'],
          recordFn: (p) => [p.power, p.mass, '冰 -> 冰水混合物 -> 水 -> 汽化'],
          presets: [
            { name: '小质量高功率 (熔化极快)', params: { power: 600, mass: 60 } },
            { name: '大质量低功率 (温度上升平缓)', params: { power: 200, mass: 180 } }
          ]
        };
      case 'lever-balance':
        return {
          schema: [],
          headers: ['左侧力矩 (g·格)', '右侧力矩 (g·格)', '是否平衡'],
          recordFn: (p) => [p.leftTorque || 0, p.rightTorque || 0, p.isBalanced || '是'],
          presets: []
        };
      case 'hollow-ball-collision':
        return {
          schema: [
            { name: '初速度 v₀', key: 'v0', min: 5, max: 20, step: 0.5, unit: 'm/s' },
            { name: '重力加速度 g', key: 'g', min: 8, max: 12, step: 0.1, unit: 'm/s²' },
            { name: '球壳直径 D', key: 'D', min: 0.15, max: 0.4, step: 0.01, unit: 'm' },
            { name: '小球直径 d', key: 'd', min: 0.01, max: 0.1, step: 0.005, unit: 'm' },
            { name: '质量比 m/M', key: 'massRatio', min: 0.5, max: 5.0, step: 0.1, unit: '' }
          ],
          headers: ['初速 v₀ (m/s)', '重力 g (m/s²)', '球壳直径 D (m)', '质量比 m/M', '落地速度'],
          recordFn: (p) => {
            const v0 = p.v0 ?? 11;
            const g = p.g ?? 10;
            const D = p.D ?? 0.25;
            const d = p.d ?? 0.05;
            const massRatio = p.massRatio ?? 3.0;
            const H = 6.0;

            const term = v0 * v0 - 2 * g * H;
            if (term < 0) return [v0, g, D, massRatio, '未触及天顶'];

            const t_ceil = (v0 - Math.sqrt(term)) / g;
            const vs_ceil_minus = v0 - g * t_ceil;
            const vs_ceil_plus = -vs_ceil_minus;
            const yb_ceil = H + d / 2;
            const vb_ceil = vs_ceil_minus;

            const v_rel = vb_ceil - vs_ceil_plus;
            if (v_rel <= 0) return [v0, g, D, massRatio, '异常'];

            const dt = (D - d) / v_rel;
            const alphVal = (1 - massRatio) / (1 + massRatio);

            let currentT = t_ceil;
            let currentYs = H;
            let currentVs = vs_ceil_plus;
            let currentYb = yb_ceil;
            let currentVb = vb_ceil;
            let colCount = 0;
            let finalLandVs = vs_ceil_plus;

            while (colCount < 50) {
              const disc = currentVs * currentVs + 2 * g * currentYs;
              let t_prime = Infinity;
              if (disc >= 0) {
                const root = (currentVs + Math.sqrt(disc)) / g;
                if (root > 0) t_prime = root;
              }

              if (t_prime <= dt) {
                finalLandVs = currentVs - g * t_prime;
                break;
              }

              currentT += dt;
              const ys_minus = currentYs + currentVs * dt - 0.5 * g * dt * dt;
              const yb_minus = currentYb + currentVb * dt - 0.5 * g * dt * dt;
              const vs_minus = currentVs - g * dt;
              const vb_minus = currentVb - g * dt;

              const vs_plus = alphVal * vs_minus + (1 - alphVal) * vb_minus;
              const vb_plus = (1 + alphVal) * vs_minus - alphVal * vb_minus;

              colCount++;
              currentYs = ys_minus;
              currentVs = vs_plus;
              currentYb = yb_minus;
              currentVb = vb_plus;
            }

            return [v0, g, D, massRatio, Math.abs(finalLandVs).toFixed(2) + ' m/s'];
          },
          presets: [
            { name: '默认题干参数 (落地 9.38 m/s)', params: { v0: 11.0, g: 10.0, D: 0.25, d: 0.05, massRatio: 3.0 } },
            { name: '高速强引力 (落地较快)', params: { v0: 15.0, g: 12.0, D: 0.25, d: 0.05, massRatio: 3.0 } },
            { name: '轻球壳 (小质量比 m/M=0.5)', params: { v0: 11.0, g: 10.0, D: 0.25, d: 0.05, massRatio: 0.5 } }
          ]
        };
      case 'free-fall':
        return {
          schema: [
            { name: '下落高度 H', key: 'height', min: 20, max: 100, step: 5, unit: 'm' },
            { name: '空气阻力系数 k', key: 'drag', min: 0.1, max: 1.5, step: 0.05, unit: '' },
            { name: '环境选择 (0-空气 1-真空)', key: 'vacuum', min: 0, max: 1, step: 1, unit: '' },
            { name: '左小球材质 (0铁, 1木, 2羽)', key: 'ball1', min: 0, max: 2, step: 1, unit: '' },
            { name: '右小球材质 (0铁, 1木, 2羽)', key: 'ball2', min: 0, max: 2, step: 1, unit: '' }
          ],
          headers: ['总高度 (m)', '阻力 k', '介质', '左球材质', '右球材质'],
          recordFn: (p) => [
            p.height, 
            p.drag, 
            p.vacuum === 1 ? '真空' : '空气', 
            p.ball1 === 0 ? '铁球' : p.ball1 === 1 ? '木球' : '羽毛',
            p.ball2 === 0 ? '铁球' : p.ball2 === 1 ? '木球' : '羽毛'
          ],
          presets: [
            { name: '伽利略斜塔真空对比 (铁球 vs 羽毛)', params: { height: 70, drag: 0.3, vacuum: 1, ball1: 0, ball2: 2 } },
            { name: '空气阻力对比 (铁球 vs 羽毛)', params: { height: 70, drag: 0.5, vacuum: 0, ball1: 0, ball2: 2 } },
            { name: '重球 vs 轻球 (铁球 vs 木球)', params: { height: 80, drag: 0.3, vacuum: 0, ball1: 0, ball2: 1 } }
          ]
        };
      case 'ohms-law':
        return {
          schema: [
            { name: '电源电压 U', key: 'voltage', min: 0.0, max: 15.0, step: 0.5, unit: 'V' },
            { name: '导体电阻 R', key: 'resistance', min: 5.0, max: 80.0, step: 2.5, unit: 'Ω' }
          ],
          headers: ['电压 U (V)', '电阻 R (Ω)', '电流 I (A)', '耗能功率 P (W)'],
          recordFn: (p) => {
            const i = p.voltage / p.resistance;
            return [p.voltage, p.resistance, i.toFixed(3) + ' A', (i * p.voltage).toFixed(2) + ' W'];
          },
          presets: [
            { name: '微弱电流 (低电压高电阻)', params: { voltage: 3.0, resistance: 60.0 } },
            { name: '强电流 (高电压低电阻)', params: { voltage: 12.0, resistance: 10.0 } }
          ]
        };
      case 'projectile-motion':
        return {
          schema: [
            { name: '抛出高度 H', key: 'height', min: 10, max: 90, step: 5, unit: 'm' },
            { name: '发射速度 v₀', key: 'v0', min: 10, max: 45, step: 1, unit: 'm/s' },
            { name: '重力加速度 g', key: 'g', min: 5.0, max: 20.0, step: 0.2, unit: 'm/s²' }
          ],
          headers: ['高度 H (m)', '初速度 v₀ (m/s)', '重力 g (m/s²)', '落地点 x (m)', '飞行时间 t (s)'],
          recordFn: (p) => {
            const t = Math.sqrt((2 * p.height) / p.g);
            const x = p.v0 * t;
            return [p.height, p.v0, p.g, x.toFixed(1) + ' m', t.toFixed(2) + ' s'];
          },
          presets: [
            { name: '地球环境普通抛出', params: { height: 40, v0: 20, g: 9.8 } },
            { name: '月球弱重力环境平抛', params: { height: 40, v0: 20, g: 1.6 } },
            { name: '超高空高速发射', params: { height: 80, v0: 35, g: 9.8 } }
          ]
        };
      case 'uniform-acceleration':
        return {
          schema: [
            { name: '初速度 v₀', key: 'v0', min: -15.0, max: 15.0, step: 1, unit: 'm/s' },
            { name: '加速度 a', key: 'a', min: -8.0, max: 8.0, step: 0.5, unit: 'm/s²' }
          ],
          headers: ['初速度 v₀ (m/s)', '加速度 a (m/s²)', '特征运动状态'],
          recordFn: (p) => {
            let desc = '匀速运动';
            if (p.a > 0) desc = p.v0 >= 0 ? '同向匀加速' : '先减速后加速';
            else if (p.a < 0) desc = p.v0 <= 0 ? '反向匀加速' : '先减速后反加';
            return [p.v0, p.a, desc];
          },
          presets: [
            { name: '从静止加速 (v₀=0, a=2.5)', params: { v0: 0, a: 2.5 } },
            { name: '减速刹车再倒车 (v₀=12, a=-3)', params: { v0: 12, a: -3.0 } },
            { name: '反向极速匀速行驶 (v₀=-10, a=0)', params: { v0: -10, a: 0.0 } }
          ]
        };
      case 'simple-pendulum':
        return {
          schema: [
            { name: '摆绳长度 L', key: 'length', min: 0.6, max: 2.8, step: 0.1, unit: 'm' },
            { name: '单摆质量 m', key: 'mass', min: 0.2, max: 4.0, step: 0.1, unit: 'kg' },
            { name: '重力加速度 g', key: 'gravity', min: 5.0, max: 20.0, step: 0.2, unit: 'm/s²' },
            { name: '空气阻尼系数', key: 'damping', min: 0.0, max: 0.25, step: 0.01, unit: '' }
          ],
          headers: ['摆长 L (m)', '摆质量 (kg)', '重力 (m/s²)', '理论周期 (s)'],
          recordFn: (p) => {
            const period = 2 * Math.PI * Math.sqrt(p.length / p.gravity);
            return [p.length, p.mass, p.gravity, period.toFixed(2) + ' s'];
          },
          presets: [
            { name: '标准无阻力单摆', params: { length: 1.5, mass: 1.0, gravity: 9.8, damping: 0.0 } },
            { name: '有阻尼摆动衰减', params: { length: 1.5, mass: 1.0, gravity: 9.8, damping: 0.08 } },
            { name: '超短高频摆 (L=0.6m)', params: { length: 0.6, mass: 2.0, gravity: 9.8, damping: 0.01 } }
          ]
        };
      case 'spring-mass':
        return {
          schema: [
            { name: '振子质量 m', key: 'mass', min: 0.2, max: 1.8, step: 0.05, unit: 'kg' },
            { name: '劲度系数 k', key: 'k', min: 15.0, max: 90.0, step: 2.5, unit: 'N/m' },
            { name: '阻尼系数 b', key: 'damping', min: 0.0, max: 1.0, step: 0.02, unit: '' }
          ],
          headers: ['滑块质量 m (kg)', '劲度系数 k (N/m)', '阻尼 b', '理想周期 T (s)'],
          recordFn: (p) => {
            const t = 2 * Math.PI * Math.sqrt(p.mass / p.k);
            return [p.mass, p.k, p.damping, t.toFixed(2) + ' s'];
          },
          presets: [
            { name: '简谐无阻尼振动', params: { mass: 0.8, k: 40.0, damping: 0.0 } },
            { name: '强阻尼快速衰减', params: { mass: 0.8, k: 40.0, damping: 0.45 } },
            { name: '轻滑块高频振子', params: { mass: 0.25, k: 70.0, damping: 0.02 } }
          ]
        };
      case 'force-composition':
        return {
          schema: [
            { name: '分力 F₁ 大小', key: 'F1', min: 0, max: 100, step: 2, unit: 'N' },
            { name: '分力 F₁ 角度', key: 'theta1', min: 0, max: 360, step: 2, unit: '°' },
            { name: '分力 F₂ 大小', key: 'F2', min: 0, max: 100, step: 2, unit: 'N' },
            { name: '分力 F₂ 角度', key: 'theta2', min: 0, max: 360, step: 2, unit: '°' }
          ],
          headers: ['力 F₁ (N)', '角 θ₁ (°)', '力 F₂ (N)', '角 θ₂ (°)', '合力 F合 (N)'],
          recordFn: (p) => {
            const r1 = p.theta1 * Math.PI / 180;
            const r2 = p.theta2 * Math.PI / 180;
            const fx = p.F1 * Math.cos(r1) + p.F2 * Math.cos(r2);
            const fy = p.F1 * Math.sin(r1) + p.F2 * Math.sin(r2);
            const net = Math.sqrt(fx * fx + fy * fy);
            return [p.F1, p.theta1, p.F2, p.theta2, net.toFixed(1) + ' N'];
          },
          presets: [
            { name: '垂直力的合成 (90°)', params: { F1: 60, theta1: 0, F2: 80, theta2: 90 } },
            { name: '等大共点力 120° 夹角', params: { F1: 50, theta1: 30, F2: 50, theta2: 150 } },
            { name: '同向最大合成力', params: { F1: 50, theta1: 45, F2: 40, theta2: 45 } }
          ]
        };
      case 'doppler-effect':
        return {
          schema: [
            { name: '声源速度 (Ma)', key: 'sourceSpeed', min: 0.0, max: 1.5, step: 0.05, unit: '' },
            { name: '声源基频', key: 'sourceFreq', min: 100, max: 500, step: 10, unit: 'Hz' }
          ],
          headers: ['波源速度 (Ma)', '基频 (Hz)', '远离 perceived (Hz)', '接近 perceived (Hz)'],
          recordFn: (p) => {
            const fl = p.sourceFreq * (1 / (1 + p.sourceSpeed));
            const fr = p.sourceSpeed < 1.0 ? p.sourceFreq * (1 / (1 - p.sourceSpeed)) : 999999;
            return [p.sourceSpeed, p.sourceFreq, fl.toFixed(0) + ' Hz', fr === 999999 ? '音障激波' : fr.toFixed(0) + ' Hz'];
          },
          presets: [
            { name: '静止声源', params: { sourceSpeed: 0.0, sourceFreq: 240 } },
            { name: '亚音速接近 (0.6Ma)', params: { sourceSpeed: 0.6, sourceFreq: 240 } },
            { name: '超音速突破 (1.2Ma 激波面)', params: { sourceSpeed: 1.2, sourceFreq: 200 } }
          ]
        };
      case 'closed-circuit-ohm':
        return {
          schema: [
            { name: '电动势 E', key: 'E', min: 1.5, max: 12.0, step: 0.5, unit: 'V' },
            { name: '内阻 r', key: 'r', min: 0.5, max: 5.0, step: 0.1, unit: 'Ω' },
            { name: '滑动变阻器 R', key: 'R', min: 0.0, max: 45.0, step: 0.5, unit: 'Ω' }
          ],
          headers: ['电动势 E (V)', '内阻 r (Ω)', '外电阻 R (Ω)', '总电流 I (A)', '路端电压 U (V)'],
          recordFn: (p) => {
            const current = p.E / (p.R + p.r);
            const terminalU = p.E - current * p.r;
            return [p.E, p.r, p.R, current.toFixed(2) + ' A', terminalU.toFixed(2) + ' V'];
          },
          presets: [
            { name: '短路状态 (R = 0 Ω)', params: { E: 6.0, r: 1.5, R: 0.0 } },
            { name: '大负载工作点 (R = 10 Ω)', params: { E: 6.0, r: 1.5, R: 10.0 } }
          ]
        };
      case 'double-slit':
        return {
          schema: [
            { name: '光波长 λ', key: 'wavelength', min: 380, max: 780, step: 5, unit: 'nm' },
            { name: '双缝间距 d', key: 'd', min: 0.10, max: 0.50, step: 0.01, unit: 'mm' },
            { name: '缝屏距离 L', key: 'L', min: 1.0, max: 3.0, step: 0.1, unit: 'm' }
          ],
          headers: ['波长 λ (nm)', '缝距 d (mm)', '缝屏距 L (m)', '条纹间距 Δx (mm)'],
          recordFn: (p) => {
            const dx = (p.L * (p.wavelength * 1e-9) / (p.d * 1e-3)) * 1000;
            return [p.wavelength, p.d, p.L, dx.toFixed(3) + ' mm'];
          },
          presets: [
            { name: '红色氦氖激光相干 (632nm)', params: { wavelength: 632, d: 0.25, L: 2.0 } },
            { name: '绿色氩激光相干 (514nm)', params: { wavelength: 514, d: 0.25, L: 2.0 } },
            { name: '缝距极窄条纹变宽', params: { wavelength: 632, d: 0.12, L: 2.5 } }
          ]
        };
      case 'ideal-gas':
        return {
          schema: [
            { name: '气体温度 T', key: 'temp', min: 100, max: 600, step: 10, unit: 'K' },
            { name: '容器体积 V', key: 'volume', min: 0.5, max: 1.5, step: 0.05, unit: 'V₀' },
            { name: '分子数 N', key: 'particles', min: 50, max: 250, step: 10, unit: '个' }
          ],
          headers: ['温度 T (K)', '体积 V', '粒子数 N', '宏观压强 P (kPa)'],
          recordFn: (p) => {
            const pres = (p.particles * 0.0035 * p.temp) / p.volume;
            return [p.temp, p.volume, p.particles, pres.toFixed(1) + ' kPa'];
          },
          presets: [
            { name: '等温压缩 (T = 300K, V = 0.6)', params: { temp: 300, volume: 0.6, particles: 100 } },
            { name: '等温膨胀 (T = 300K, V = 1.4)', params: { temp: 300, volume: 1.4, particles: 100 } },
            { name: '高温强压状态 (T = 550K)', params: { temp: 550, volume: 0.6, particles: 180 } }
          ]
        };
      case 'kclo3-oxygen':
        return {
          schema: [
            { name: '催化剂用量', key: 'catalystAmount', min: 1, max: 10, step: 1, unit: '勺' }
          ],
          headers: ['反应物', '催化剂', '收集气体体积'],
          recordFn: (p) => ['KClO₃', 'MnO₂', `${p.catalystAmount} 勺`],
          presets: [{ name: '标准催化分解', params: { catalystAmount: 5 } }]
        };
      case 'iron-oxygen':
      case 'phosphorus-oxygen':
      case 'sulfur-oxygen':
        return {
          schema: [
            { name: '氧气浓度', key: 'oxygenPurity', min: 10, max: 50, step: 5, unit: '粒子' }
          ],
          headers: ['反应瓶', '氧气分子数', '燃烧状态'],
          recordFn: (p) => ['集气瓶', `${p.oxygenPurity} 粒子`, '点燃'],
          presets: [{ name: '标准纯氧燃烧', params: { oxygenPurity: 30 } }]
        };
      case 'electrolysis-water':
        return {
          schema: [
            { name: '直流电电压', key: 'voltage', min: 3, max: 15, step: 0.5, unit: 'V' }
          ],
          headers: ['通电电压 (V)', '导电介质', '反应进度'],
          recordFn: (p) => [p.voltage, '稀硫酸', '通电中'],
          presets: [{ name: '标准电压电解', params: { voltage: 9.0 } }]
        };
      case 'oxygen-lab':
        return {
          schema: [
            { name: '催化剂用量', key: 'catalystAmount', min: 1, max: 10, step: 1, unit: '勺' }
          ],
          headers: ['收集装置', '催化剂量', '综合性质验证'],
          recordFn: (p) => ['排水集气', `${p.catalystAmount} 勺`, '双步骤反应'],
          presets: [{ name: '氧气制取与性质综合', params: { catalystAmount: 5 } }]
        };
      default:
        return { schema: [], headers: [], recordFn: () => [] };
    }
  };

  // Switch Grade Level tabs
  const handleGradeChange = (newGrade: Grade) => {
    setGrade(newGrade);
    setSelectedSimId(null); // Return to home tree
    setSearchQuery('');
  };

  // Route to specific simulation
  const handleSelectSim = (id: string) => {
    // Find selected simulation details
    const sim = allSimulations.find(s => s.id === id);
    if (sim) {
      setGrade(sim.grade);
      setSelectedSimId(id);
      setCurrentView('workbench');
      setIsSidebarOpen(false); // Close sidebar on mobile catalog select
    }
  };

  const handleGoHome = () => {
    setCurrentView('landing');
    setSelectedSimId(null);
    setSearchQuery('');
  };

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Filter simulations list by subject, grade and search input keyword
  const filteredSimulations = allSimulations.filter(sim => {
    const simSubject = sim.subject || 'physics';
    if (simSubject !== subject) return false;
    if (sim.grade !== grade) return false;
    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    const matchesName = sim.name.toLowerCase().includes(query);
    const matchesDesc = sim.description.toLowerCase().includes(query);
    const matchesCat = sim.category.toLowerCase().includes(query);
    return matchesName || matchesDesc || matchesCat;
  });

  const selectedSim = allSimulations.find(s => s.id === selectedSimId);
  const activeSchemaInfo = selectedSimId ? getSimSchema(selectedSimId) : null;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--text-secondary)]">正在加载实验室...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans overflow-x-hidden transition-colors duration-200">
      {/* 顶部导航 */}
      <Navbar
        currentGrade={grade}
        onGradeChange={handleGradeChange}
        currentSubject={subject}
        onSubjectChange={(newSub) => {
          setSubject(newSub);
          if (newSub === 'chemistry') {
            setGrade('junior');
          }
          setSelectedSimId(null);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLightMode={isLightMode}
        onToggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={toggleMobileMenu}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onGoHome={handleGoHome}
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        isMobileCatalogOpen={isMobileCatalogOpen}
        onToggleMobileCatalog={() => setIsMobileCatalogOpen(!isMobileCatalogOpen)}
      />

      {/* 主视图渲染 */}
      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <LandingPage
              onEnterGrade={(selectedGrade, selectedSubject = 'physics') => {
                setGrade(selectedGrade);
                setSubject(selectedSubject);
                setSelectedSimId(null);
                setCurrentView('workbench');
              }}
              onSelectSim={(simId) => {
                setSelectedSimId(simId);
                const sim = allSimulations.find(s => s.id === simId);
                if (sim) {
                  setGrade(sim.grade);
                  setSubject(sim.subject || 'physics');
                }
                setCurrentView('workbench');
              }}
              onGeneratePrompt={(prompt) => {
                setInitialPrompt(prompt);
                setCurrentView('ai-lab');
              }}
              allSimulations={allSimulations}
            />
          </motion.div>
        )}

        {currentView === 'workbench' && (
          <motion.div
            key="workbench"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <main className="main-layout flex-1">
              {/* Sidebar Backdrop for Mobile */}
              {isMobileCatalogOpen && (
                <div 
                  onClick={() => setIsMobileCatalogOpen(false)}
                  className="fixed inset-0 top-16 bg-black/50 z-30 md:hidden"
                />
              )}

              {/* 左侧侧边栏 */}
              <Sidebar
                grade={grade}
                simulations={filteredSimulations}
                selectedSimId={selectedSimId}
                onSelectSim={(simId) => {
                  handleSelectSim(simId);
                  setIsMobileCatalogOpen(false); // Auto close catalog drawer on mobile selection
                }}
                isOpen={isMobileCatalogOpen}
                onClose={() => setIsMobileCatalogOpen(false)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />


              {/* 内容展示区 */}
              <section className="content-area flex-1">
                {selectedSim && activeSchemaInfo ? (
                  /* 模拟器详情页面 */
                  <SimulationContainer
                    key={selectedSim.id}
                    sim={selectedSim}
                    parameterSchema={activeSchemaInfo.schema}
                    dataHeaders={activeSchemaInfo.headers}
                    getDataRecord={activeSchemaInfo.recordFn}
                    presets={activeSchemaInfo.presets}
                  />
                ) : (
                  /* 首页：实验台指南与分类导航 */
                  <WorkbenchGuide
                    grade={grade}
                    subject={subject}
                    simulations={allSimulations.filter(s => s.grade === grade && (s.subject || 'physics') === subject)}
                    onSelectSim={handleSelectSim}
                  />
                )}
              </section>
            </main>
          </motion.div>
        )}

        {currentView === 'ai-lab' && (
          <motion.div
            key="ai-lab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <AiLabView 
              initialPrompt={initialPrompt}
              onClearInitialPrompt={() => setInitialPrompt(null)}
              onSelectSim={(simId) => {
                setSelectedSimId(simId);
                const sim = allSimulations.find(s => s.id === simId);
                if (sim) {
                  setGrade(sim.grade);
                  setSubject(sim.subject || 'physics');
                }
                setCurrentView('workbench');
              }}
              onGoToWorkbench={() => setCurrentView('workbench')}
              allSimulations={allSimulations}
            />
          </motion.div>
        )}

        {currentView === 'my-experiments' && (
          <motion.div
            key="my-experiments"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <MyExperimentsView 
              onSelectSim={(simId) => {
                setSelectedSimId(simId);
                const sim = allSimulations.find(s => s.id === simId);
                if (sim) {
                  setGrade(sim.grade);
                  setSubject(sim.subject || 'physics');
                }
                setCurrentView('workbench');
              }}
            />
          </motion.div>
        )}

        {currentView === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <AboutView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

