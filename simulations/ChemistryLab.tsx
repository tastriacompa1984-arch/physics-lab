"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, RotateCcw, Flame, Droplet, AlertTriangle, CheckCircle2, Info, ArrowRight, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { drawGrid, drawLabel } from '../utils';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ChemistryLabProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  experimentId: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string; // e.g. "KClO3", "O2", "MnO2", "H+", "OH-", "Na+", "Cl-", "Fe", "CO2", "H2O"
  type: 'reactant' | 'product' | 'catalyst' | 'solvent' | 'smoke' | 'spark';
  opacity?: number;
  life?: number;
  maxLife?: number;
}

export interface LabStep {
  title: string;
  instruction: string;
  actionLabel: string;
  actionType: string;
  precaution: string;
  formula?: string;
}

export const getStepsForExperiment = (id: string): LabStep[] => {
  switch (id) {
    case 'kclo3-oxygen':
      return [
        {
          title: '检查装置气密性',
          instruction: '在进行实验前，必须检验装置的气密性。请点击右下角【检查气密性】按钮。',
          actionLabel: '检查气密性',
          actionType: 'check_seal',
          precaution: '注意：若手握试管导管口有气泡冒出，且松手后形成一段水柱，说明气密性良好。',
          formula: '制氧原理：2KClO₃ ➔(MnO₂, △) 2KCl + 3O₂↑'
        },
        {
          title: '装入药品并固定试管',
          instruction: '往试管底部装入白色粉末状的氯酸钾和少量黑色二氧化锰粉末，斜向下固定试管。',
          actionLabel: '装入药品固体',
          actionType: 'add_reactants',
          precaution: '注意：二氧化锰起催化作用；试管口略向下倾斜，防止冷凝水回流炸裂试管。',
          formula: '催化剂：MnO₂（质量和化学性质在反应前后不改变）'
        },
        {
          title: '酒精灯预热与加热',
          instruction: '点燃酒精灯，先对试管进行来回移动预热，然后固定在有药品的部位用外焰加热。',
          actionLabel: '点燃酒精灯加热',
          actionType: 'heat',
          precaution: '注意：必须先预热防止局部骤热导致试管破裂；酒精灯应使用温度最高的外焰加热。',
          formula: '加热符号：△'
        },
        {
          title: '排水集气收集氧气',
          instruction: '当导管口产生连续均匀的气泡时，将导管口伸入充满水的倒立集气瓶中收集氧气。',
          actionLabel: '开始排水法收集',
          actionType: 'collect',
          precaution: '注意：刚开始冒出的气泡是受热膨胀排出的空气，不能立即收集；等气泡连续均匀冒出时再收集。',
          formula: '集气原理：氧气不易溶于水，且不与水反应'
        },
        {
          title: '实验完毕安全收尾',
          instruction: '集气瓶收集满氧气（水位降至底部）。此时要特别注意收尾顺序，请先将导管移出水槽！',
          actionLabel: '移出导管',
          actionType: 'remove_tube',
          precaution: '警告：必须先将导管移出水面，然后再熄灭酒精灯！若先灭灯，冷水倒吸会使热试管炸裂！',
          formula: '安全第一：移导管 ➔ 灭酒精灯 (防倒吸)'
        },
        {
          title: '熄灭酒精灯',
          instruction: '已成功移出导管。现在可以安全地熄灭酒精灯，结束实验。',
          actionLabel: '熄灭酒精灯',
          actionType: 'extinguish',
          precaution: '注意：使用灯帽盖灭酒精灯，禁止用嘴吹灭。',
          formula: '收尾阶段'
        }
      ];
    case 'iron-oxygen':
      return [
        {
          title: '铺设瓶底安全沙',
          instruction: '为防止高温产物损坏仪器，在集气瓶底部铺设一层细沙或倒入少量水。',
          actionLabel: '铺设底沙',
          actionType: 'pour_sand',
          precaution: '注意：铁燃烧产生的高温熔融物溅落到瓶底，若无细沙或水，会使集气瓶底部炸裂。',
          formula: '保护措施：铺沙或倒水'
        },
        {
          title: '打磨并缠绕铁丝',
          instruction: '用砂纸打磨铁丝去除表面的铁锈，并将其绕成螺旋状以增大受热面积，在底部系上一根火柴引燃。',
          actionLabel: '打磨并缠绕铁丝',
          actionType: 'prepare_iron',
          precaution: '注意：打磨可以暴露出亮白色的金属铁单质；螺旋状可以减缓铁丝下落的热量流失，易于聚热。',
          formula: '引燃准备：螺旋铁丝 + 火柴'
        },
        {
          title: '点燃火柴并伸入瓶中',
          instruction: '点燃引燃的火柴，待火柴即将燃尽时，将铁丝缓缓由上而下伸入盛满氧气的集气瓶中。',
          actionLabel: '引燃火柴并伸入瓶中',
          actionType: 'insert_iron',
          precaution: '注意：若火柴燃烧过旺时伸入，会消耗集气瓶内过多的氧气，导致铁丝无法顺利燃烧。',
          formula: '伸入时机：火柴快燃尽时'
        },
        {
          title: '观察剧烈燃烧现象',
          instruction: '铁丝在纯氧中剧烈燃烧，火星四射。请观察铁丝表面的燃烧情况和生成的黑色固体。',
          actionLabel: '开始反应',
          actionType: 'burn_iron',
          precaution: '现象：剧烈燃烧，火星四射，生成黑色固体，放出大量的热。',
          formula: '化学反应式：3Fe + 2O₂ ➔(点燃) Fe₃O₄ (四氧化三铁)'
        }
      ];
    case 'phosphorus-oxygen':
      return [
        {
          title: '装入红磷药品',
          instruction: '向燃烧匙中装入足量的红磷固体。点击装药。',
          actionLabel: '装入红磷',
          actionType: 'add_phosphorus',
          precaution: '注意：红磷量必须充足，以充分消耗集气瓶内的氧气。',
          formula: '反应原料：红磷 (P)'
        },
        {
          title: '在空气中引燃',
          instruction: '用酒精灯点燃燃烧匙内的红磷。',
          actionLabel: '空气中点燃红磷',
          actionType: 'ignite_phosphorus_air',
          precaution: '现象：在空气中燃烧产生黄色火焰，并伴随少量白烟。',
          formula: '初级反应：红磷与空气中氧气反应'
        },
        {
          title: '伸入瓶中并密闭',
          instruction: '将点燃的燃烧匙迅速伸入装有氧气的集气瓶中，并立即塞紧胶塞。',
          actionLabel: '伸入集气瓶并塞紧胶塞',
          actionType: 'insert_phosphorus',
          precaution: '现象：剧烈燃烧，发出耀眼白光，放热，并产生大量白烟（五氧化二磷固体小颗粒，并非白雾）。',
          formula: '剧烈燃烧：4P + 5O₂ ➔(点燃) 2P₂O₅ (五氧化二磷)'
        }
      ];
    case 'sulfur-oxygen':
      return [
        {
          title: '瓶底注水与装硫粉',
          instruction: '往集气瓶底部注入少量水（用于吸收有毒的二氧化硫），并在燃烧匙中加入硫粉。',
          actionLabel: '注入底水并装入硫粉',
          actionType: 'add_sulfur',
          precaution: '安全警告：二氧化硫是有毒刺激性气体，瓶底注入水（或氢氧化钠溶液）非常关键！',
          formula: '环境保护：用水吸收 SO₂ 气体'
        },
        {
          title: '在空气中引燃硫粉',
          instruction: '用酒精灯点燃燃烧匙内的硫粉。',
          actionLabel: '空气中点燃硫粉',
          actionType: 'ignite_sulfur_air',
          precaution: '现象：在空气中燃烧发出微弱的淡蓝色火焰。',
          formula: '空气中燃烧：S + O₂ ➔ SO₂'
        },
        {
          title: '伸入充满氧气的集气瓶',
          instruction: '将点燃的硫粉迅速伸入充满氧气的集气瓶中。',
          actionLabel: '伸入氧气集气瓶中',
          actionType: 'insert_sulfur',
          precaution: '现象：剧烈燃烧，发出明亮的蓝紫色火焰，生成有刺激性气味的气体，放出热量。',
          formula: '纯氧中燃烧：S + O₂ ➔(点燃) SO₂'
        }
      ];
    case 'co2-naoh':
      return [
        {
          title: '准备CO2烧瓶与气球',
          instruction: '准备一瓶装满二氧化碳气体的圆底烧瓶，瓶口安装上单孔胶塞（内连一红色小气球）。',
          actionLabel: '组装CO2烧瓶装置',
          actionType: 'assemble_co2_flask',
          precaution: '原理：二氧化碳与碱反应，瓶内压强减小，外部气压将气球吹大。',
          formula: '反应方程式：CO₂ + 2NaOH ➔ Na₂CO₃ + H₂O'
        },
        {
          title: '安装碱液注射器',
          instruction: '在胶塞的另一孔中插入装有浓氢氧化钠溶液的注射器。',
          actionLabel: '安装碱液注射器',
          actionType: 'install_syringe',
          precaution: '注意：密封性要好，防止漏气导致实验失败。',
          formula: '反应物：CO₂ 气体与 NaOH 溶液'
        },
        {
          title: '推动注入氢氧化钠',
          instruction: '缓缓推动注射器活塞，将氢氧化钠溶液全部注入烧瓶中，观察气球的变化。',
          actionLabel: '推动注入NaOH',
          actionType: 'inject_naoh',
          precaution: '现象：红颜色液体注入瓶底，圆底烧瓶内部气压骤降，小气球急剧膨胀。',
          formula: '压强效应：气体被吸收 ➔ 内部气压 ➔ 气球鼓起'
        }
      ];
    case 'electrolysis-water':
      return [
        {
          title: '添加稀硫酸增强导电性',
          instruction: '往霍夫曼电解器中倒满蒸馏水，并滴加少量稀硫酸（或者氢氧化钠）。',
          actionLabel: '滴加少量稀硫酸',
          actionType: 'add_h2so4',
          precaution: '注意：纯水不导电或导电极弱，加入强酸电解质可以显著增强水的导电性能。',
          formula: '电解反应：2H₂O ➔(通电) 2H₂↑ + O₂↑'
        },
        {
          title: '接通直流电源',
          instruction: '接通直流电源，调节电压至9-12V，开始电解水实验。',
          actionLabel: '接通直流电电解',
          actionType: 'turn_on_power',
          precaution: '现象：两个电极表面产生大量气泡，玻璃管内的水位开始被排开下降。',
          formula: '极板现象：阴极产生氢气，阳极产生氧气'
        },
        {
          title: '检验生成的气体',
          instruction: '当两管中收集满气体时，分别用带火星木条和燃着的木条检验。',
          actionLabel: '检验 H₂ 与 O₂',
          actionType: 'test_gas',
          precaution: '体积比：阳极与阴极气体体积比约为 1:2。负氢二，正氧一。',
          formula: '体积比：V(H₂) : V(O₂) ≈ 2 : 1'
        }
      ];
    case 'salt-purification':
      return [
        {
          title: '第一步：称量与溶解',
          instruction: '称取5g粗盐倒入盛有10mL水的烧杯中，并用玻璃棒进行搅拌使其充分溶解。',
          actionLabel: '加盐并用玻璃棒搅拌溶解',
          actionType: 'dissolve_salt',
          precaution: '玻璃棒作用：搅拌加速溶解。注意力度，避免划伤或敲碎烧杯。',
          formula: '提纯步骤 1：溶解（去除不溶性泥沙的前期准备）'
        },
        {
          title: '第二步：引流过滤',
          instruction: '将折好的滤纸过滤器放入漏斗，将烧杯中的悬浊液沿玻璃棒缓缓引流注入漏斗中过滤。',
          actionLabel: '引流过滤泥沙',
          actionType: 'filter_sand',
          precaution: '注意事项：一贴二低三靠。滤液低于滤纸边缘，漏斗末端紧靠烧杯内壁以防飞溅。',
          formula: '提纯步骤 2：过滤（物理分离法去除难溶性泥沙）'
        },
        {
          title: '第三步：蒸发结晶',
          instruction: '将滤液倒入蒸发皿，用酒精灯加热，用玻璃棒不断搅拌。当有较多晶体析出时熄灭酒精灯。',
          actionLabel: '转移至蒸发皿并加热搅拌',
          actionType: 'evaporate_liquid',
          precaution: '注意事项：搅拌是防局部受热液体飞溅。出现大量固体时停止加热，利用余热蒸干。',
          formula: '提纯步骤 3：蒸发（析出精盐 NaCl 晶体）'
        }
      ];
    case 'oxygen-lab':
      return [
        {
          title: '检验气密性并装药',
          instruction: '检验装置气密性，然后将氯酸钾与二氧化锰的混合物装入试管，固定好。',
          actionLabel: '装药与气密性检查',
          actionType: 'prep_kclo3_lab',
          precaution: '注意：综合性制备性质实验，需要经历氧气的产生、收集以及随后的化学性质反应。',
          formula: '制取方程式：2KClO₃ ➔(MnO₂, △) 2KCl + 3O₂↑'
        },
        {
          title: '加热并排水集气',
          instruction: '用酒精灯加热试管，等待气泡连续均匀冒出，集气瓶水位开始下降。',
          actionLabel: '点燃加热收集氧气',
          actionType: 'heat_collect_lab',
          precaution: '注意：必须收集满整瓶氧气后方可开展后面的性质点燃试验。',
          formula: '收集法：排水集气法（易收集到纯净气体）'
        },
        {
          title: '防止倒吸：移管灭灯',
          instruction: '气体收集满。必须先将导管从水槽中拿出，再熄灭酒精灯加热！',
          actionLabel: '先移出导管',
          actionType: 'remove_tube_lab',
          precaution: '安全警示：顺序不能搞反！先灭酒精灯会导致水吸入受热试管，发生剧烈炸裂！',
          formula: '安全防护：先移管，后灭灯'
        },
        {
          title: '验证性质：选择材料燃烧',
          instruction: '将收集的氧气平放，在上方选择铁丝(Fe)、红磷(P)或硫黄(S)中的一种，点燃伸入。',
          actionLabel: '点燃燃烧匙中物质伸入',
          actionType: 'combust_selected',
          precaution: '不同的燃料会呈现截然不同的发光、烟雾或火焰颜色。',
          formula: '性质验证：金属与非金属在氧气中燃烧'
        }
      ];
    case 'co2-lab':
      return [
        {
          title: '装置检验气密性',
          instruction: '连接锥形瓶与导管，首先执行气密性检验。',
          actionLabel: '检验气密性',
          actionType: 'check_seal_co2',
          precaution: '注意：二氧化碳是无色无味的气体，良好的气密性可以防止气体四溢无法收集。',
          formula: '二氧化碳制法：固液常温型'
        },
        {
          title: '大理石与酸液反应',
          instruction: '向锥形瓶中加入石灰石，并倒入稀盐酸，生成二氧化碳气体。',
          actionLabel: '投入大理石并注入稀盐酸',
          actionType: 'add_cacos_hcl',
          precaution: '注意：不可用稀硫酸（会产生微溶的硫酸钙阻碍反应）或浓盐酸（易挥发HCl使气体不纯）。',
          formula: '制取方程式：CaCO₃ + 2HCl ➔ CaCl₂ + H₂O + CO₂↑'
        },
        {
          title: '性质一：倒CO2熄灭蜡烛',
          instruction: '将产生的CO₂通入带有高低阶梯蜡烛的瓶子中，观察蜡烛熄灭的顺序。',
          actionLabel: '通入阶梯蜡烛瓶中',
          actionType: 'extinguish_candles',
          precaution: '现象：底部的矮蜡烛先灭，高处的长蜡烛后灭。',
          formula: '二氧化碳性质：密度比空气大，不燃烧，也不支持燃烧'
        },
        {
          title: '性质二：通入石蕊试液',
          instruction: '将气体通入装有紫色石蕊溶液的试管中。',
          actionLabel: '通入紫色石蕊溶液中',
          actionType: 'bubble_litmus',
          precaution: '现象：紫色溶液变红。原因：CO₂ + H₂O ➔ H₂CO₃（生成的碳酸显酸性，而非CO₂本身）。',
          formula: '水化产物：H₂CO₃ (弱酸，受热易分解)'
        }
      ];
    case 'metal-reactions':
      return [
        {
          title: '用砂纸打磨金属片',
          instruction: '准备镁(Mg)、锌(Zn)、铁(Fe)、铜(Cu)四种金属，用砂纸擦去表面的氧化膜。',
          actionLabel: '用砂纸打磨金属表面',
          actionType: 'polish_metals',
          precaution: '注意：打磨除去表面的氧化膜和金属锈迹，以免影响与酸反应的速率。',
          formula: '反应前处理：除去保护氧化膜'
        },
        {
          title: '注入稀盐酸溶液',
          instruction: '往四支试管中分别注入等体积、等浓度的稀盐酸。',
          actionLabel: '注入稀盐酸',
          actionType: 'fill_acids',
          precaution: '控制变量：本实验使用相同量的稀盐酸，来比对金属的活动性强弱。',
          formula: '反应介质：稀盐酸 (HCl)'
        },
        {
          title: '投入金属片观察反应',
          instruction: '将金属片同时投入四支试管中，观察产生氢气气泡的速率。',
          actionLabel: '投入金属片反应',
          actionType: 'drop_metals_reaction',
          precaution: '现象：Mg最剧烈；Zn产生气泡较快；Fe缓慢冒出气泡且溶液逐渐变浅绿色；Cu无气泡。',
          formula: '金属活动性强弱顺序：Mg > Zn > Fe > (H) > Cu'
        }
      ];
    case 'combustion-conditions':
      return [
        {
          title: '组装装置放置磷',
          instruction: '在铜片一端放一小块白磷，另一端放红磷。水底也放一小块白磷。注入80℃的热水。',
          actionLabel: '加红白磷并注入热水',
          actionType: 'prep_phosphorus_beaker',
          precaution: '参数：白磷着火点40℃，红磷240℃。热水一方面提供热量，另一方面使水下白磷缺氧。',
          formula: '实验设计：控制变量对比法'
        },
        {
          title: '对比铜片与水下燃况',
          instruction: '观察铜片白磷在受热且接触氧气时燃烧。红磷和水底白磷则不发生燃烧。',
          actionLabel: '记录对照点燃状态',
          actionType: 'observe_initial_combustion',
          precaution: '结论：红磷因温度未达着火点不燃；水下白磷因没有氧气不燃；铜片白磷二者皆具备而燃烧。',
          formula: '燃烧三要素：可燃物 + 氧气 + 达着火点'
        },
        {
          title: '水下白磷通氧燃烧',
          instruction: '通过导管向烧杯底部的白磷吹入氧气，观察热水里白磷的变化。',
          actionLabel: '向水下白磷吹入氧气',
          actionType: 'bubble_underwater_oxygen',
          precaution: '现象：水下的白磷接触到氧气后，在热水里也剧烈燃烧起来，火光四射。',
          formula: '水下奇观：水火相融（满足氧气和温度条件即可燃烧）'
        }
      ];
    case 'nacl-solution':
      return [
        {
          title: '称量：托盘天平称食盐',
          instruction: '在托盘天平两边各放一张干净纸。长按称量食盐按钮，称量 10.0g 食盐固体。',
          actionLabel: '天平称量食盐固体 (长按至10.0g)',
          actionType: 'weigh_salt_nacl',
          precaution: '注意：称量时左物右码，药匙添加要轻缓。',
          formula: '配制目标：100g 质量分数为 10% 的 NaCl 溶液'
        },
        {
          title: '量取：用量筒量取水',
          instruction: '选择合适量筒。长按量取水按钮，量取 90.0mL（即90.0g）水。',
          actionLabel: '用量筒量取水 (长按至90mL)',
          actionType: 'measure_water_nacl',
          precaution: '注意：读数时视线要平视，仰视量取偏大，俯视量取偏小。',
          formula: '溶剂计算：100g - 10g = 90g (约 90mL)'
        },
        {
          title: '溶解：烧杯混合搅拌',
          instruction: '将固体倒入烧杯，将水倒入烧杯。用玻璃棒搅拌，直到固体完全溶解。',
          actionLabel: '倒入烧杯并用玻璃棒搅拌',
          actionType: 'mix_nacl_solution',
          precaution: '注意：玻璃棒只在溶液内部做圆周旋转运动，不要频繁碰撞烧杯底或壁。',
          formula: '质量分数公式：溶质质量 / (溶质质量 + 溶剂质量) × 100%'
        }
      ];
    case 'acid-base':
      return [
        {
          title: '滴加酸碱指示剂',
          instruction: '往盛水的烧杯中滴加酸碱指示剂，可选紫色石蕊溶液或无色酚酞溶液。',
          actionLabel: '滴加指示剂',
          actionType: 'add_indicator',
          precaution: '指示剂选择：石蕊遇酸变红、遇碱变蓝；酚酞遇酸不变色，遇碱变红。',
          formula: '滴定准备'
        },
        {
          title: '滴加碱液改变酸碱度',
          instruction: '往烧杯中滴加氢氧化钠溶液，直至溶液pH变大，观察显色变化。',
          actionLabel: '滴加氢氧化钠 (NaOH) 碱液',
          actionType: 'drop_alkali_base',
          precaution: '现象：石蕊由紫色变蓝；酚酞由无色变红色。',
          formula: '碱性环境：pH > 7'
        },
        {
          title: '滴酸中和滴定反应',
          instruction: '往红色/蓝色溶液中滴加稀盐酸，用玻璃棒不断搅拌。观察酸碱中和及放热。',
          actionLabel: '滴加稀盐酸 (HCl) 酸液中和',
          actionType: 'drop_acid_neutralize',
          precaution: '现象：当pH恢复为7时，石蕊变回紫色，酚酞褪色。中和反应是放热反应，温度会上升。',
          formula: '中和实质：H⁺ + OH⁻ ➔ H₂O'
        }
      ];
    default:
      return [];
  }
};

interface ThreeDLabProps {
  experimentId: string;
  stateRef: React.MutableRefObject<any>;
  isHeating: boolean;
  isIgnited: boolean;
  tubeRemoved: boolean;
  selectedFuel: 'Fe' | 'P' | 'S';
  currentStage: 'dissolve' | 'filter' | 'evaporate';
  metalPolished: boolean;
  reagentsAdded: boolean;
  customAction: string;
  apparatusAssembled: boolean;
  currentStep: number;
  stirring: boolean;
  litmusAdded: boolean;
  phenolphthaleinAdded: boolean;
  isPlaying: boolean;
  isEnlarged: boolean;
  parameters: Record<string, number>;
}

const renderApparatus = (
  id: string,
  glassMat: any,
  isHeating: boolean,
  isIgnited: boolean,
  tubeRemoved: boolean,
  selectedFuel: string,
  currentStage: string,
  metalPolished: boolean,
  reagentsAdded: boolean,
  customAction: string,
  apparatusAssembled: boolean,
  currentStep: number,
  stirring: boolean,
  litmusAdded: boolean,
  phenolphthaleinAdded: boolean,
  ph: number,
  gasVolumeLeft: number,
  gasVolumeRight: number,
  waterMeasured: number,
  naclWeighed: number,
  candleHeightLow: number,
  candleHeightHigh: number,
  co2Poured: number,
  dissolveProgress: number,
  dropY: number,
  isDropping: boolean,
  isPlaying: boolean,
  showCathodeLabel?: boolean,
  setShowCathodeLabel?: (v: boolean) => void,
  showAnodeLabel?: boolean,
  setShowAnodeLabel?: (v: boolean) => void,
  parameters?: Record<string, number>
) => {
  switch (id) {
    case 'kclo3-oxygen':
    case 'oxygen-lab': {
      const isO2Lab = id === 'oxygen-lab';
      const showHeatingTube = !isO2Lab || currentStep < 3;

      return (
        <group position={[0, -0.2, 0]}>
          {/* Main Heating Test Tube (tilted) */}
          {showHeatingTube && (
            <group position={[-1.88, 0.7, 0]} rotation={[0, 0, -Math.PI / 18]}>
              {/* Stopper */}
              <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.22, 0.18, 0.2, 16]} />
                <meshStandardMaterial color="#4b5563" roughness={0.8} />
              </mesh>
              {/* Glass Tube body */}
              <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.22, 0.22, 1.8, 32, 1, true]} />
                {glassMat}
              </mesh>
              {/* Glass Tube bottom sphere cap */}
              <mesh position={[-0.9, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                <sphereGeometry args={[0.22, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} />
                {glassMat}
              </mesh>
            </group>
          )}

          {/* ============ DELIVERY TUBE (弯曲导气管) ============ */}
          {showHeatingTube && (
            <group>
              <mesh>
                <tubeGeometry args={[
                  new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-0.99, 0.54, 0),
                    new THREE.Vector3(-0.85, 0.1, 0),
                    new THREE.Vector3(-0.8, -0.8, 0),
                    new THREE.Vector3(-0.7, -0.8, 0),
                    new THREE.Vector3(-0.7, -0.4, 0)
                  ]), 64, 0.022, 8, false
                ]} />
                {glassMat}
              </mesh>
              {/* Tube tip opening - glows when gas is flowing */}
              {isHeating && currentStep >= 3 && (
                <mesh position={[-0.7, -0.4, 0]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
                </mesh>
              )}
            </group>
          )}

          {/* Alcohol burner lamp */}
          {showHeatingTube && (
            <group position={[-2.2, -0.4, 0]}>
              {/* Lamp body */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.45, 0.5, 32]} />
                <meshStandardMaterial color="#475569" transparent opacity={0.6} roughness={0.1} />
              </mesh>
              {/* Cap/wick holder */}
              <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
              </mesh>
              {/* Wick */}
              <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                <meshBasicMaterial color="#111827" />
              </mesh>
              {/* Flame (glowing cone + pointLight) */}
              {isHeating && (
                <group position={[0, 0.55, 0]}>
                  <mesh>
                    <coneGeometry args={[0.12, 0.4, 16]} />
                    <meshBasicMaterial color="#f97316" />
                  </mesh>
                  <pointLight color="#f97316" intensity={2.0} distance={3} />
                </group>
              )}
            </group>
          )}

          {/* Water trough */}
          <mesh position={[-0.5, -0.7, 0]}>
            <boxGeometry args={[1.6, 0.5, 1.2]} />
            <meshPhysicalMaterial color="#38bdf8" roughness={0.1} transmission={0.9} thickness={0.1} transparent opacity={0.2} />
          </mesh>

          {/* Gas collection bottle (inverted jar) */}
          <group position={[-0.7, -0.1, 0]}>
            {/* Glass body */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 1.2, 32, 1, true]} />
              {glassMat}
            </mesh>
            {/* Bottom cap (at top in inverted view) */}
            <mesh position={[0, 0.6, 0]}>
              <circleGeometry args={[0.28, 32]} />
              {glassMat}
            </mesh>
            {/* Water column inside (shrinks as gas volume rises) */}
            {gasVolumeLeft < 60 && (
              <mesh position={[0, -0.6 + (1.2 * (1 - gasVolumeLeft/60))/2, 0]}>
                <cylinderGeometry args={[0.27, 0.27, 1.2 * (1 - gasVolumeLeft/60), 32]} />
                <meshStandardMaterial color="#3b82f6" transparent opacity={0.35} roughness={0.1} />
              </mesh>
            )}
          </group>

          {/* Properties combustion jar (Only in oxygen-lab properties step) */}
          {isO2Lab && currentStep >= 3 && (
            <group position={[1.77, 0, 0]}>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 2.0, 32, 1, true]} />
                {glassMat}
              </mesh>
              <mesh position={[0, -1.0, 0]} rotation={[Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                {glassMat}
              </mesh>
              {/* Bottom Sand */}
              <mesh position={[0, -0.95, 0]}>
                <cylinderGeometry args={[0.79, 0.79, 0.1, 32]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
              {/* Burning Spoon */}
              <group position={[0, 0.4, 0]}>
                <mesh position={[0, 0.5, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[0, -0.05, 0]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.06, 16]} />
                  <meshStandardMaterial color="#64748b" metalness={0.8} />
                </mesh>
              </group>
              {/* Burning Light */}
              {isIgnited && (
                <group position={[0, 0.35, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.18, 16, 16]} />
                    <meshBasicMaterial color={selectedFuel === 'Fe' ? '#f97316' : selectedFuel === 'P' ? '#ffffff' : '#8b5cf6'} />
                  </mesh>
                  <pointLight color={selectedFuel === 'Fe' ? '#f97316' : selectedFuel === 'P' ? '#ffffff' : '#8b5cf6'} intensity={3.5} distance={4} />
                </group>
              )}
            </group>
          )}
        </group>
      );
    }

    case 'iron-oxygen': {
      const matchColor = isIgnited ? '#1c1917' : '#b45309';
      const headColor = isIgnited ? '#1c1917' : '#dc2626';

      return (
        <group position={[0, -0.15, 0]}>
          {/* Wide-mouth gas jar */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 1.6, 32, 1, true]} />
            {glassMat}
          </mesh>
          <mesh position={[0, -0.8, 0]} rotation={[Math.PI/2, 0, 0]}>
            <circleGeometry args={[0.6, 32]} />
            {glassMat}
          </mesh>
          {/* Water/sand protective layer at bottom */}
          <mesh position={[0, -0.73, 0]}>
            <cylinderGeometry args={[0.58, 0.58, 0.12, 32]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.05} transparent opacity={0.35} />
          </mesh>

          {/* Crucible tongs (坩埚钳) holding spiral iron wire */}
          <group position={[0, 0.35, 0]}>
            {/* Tongs handle coming from top-right */}
            <mesh position={[0.15, 0.7, 0]} rotation={[0.2, 0, -0.3]}>
              <boxGeometry args={[0.02, 0.8, 0.02]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[-0.08, 0.7, 0]} rotation={[0.2, 0, 0.3]}>
              <boxGeometry args={[0.02, 0.8, 0.02]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Spiral iron wire (螺旋状铁丝 to increase surface area) */}
            <group position={[0, 0.05, 0]}>
              {[...Array(12)].map((_, i) => {
                const t = i / 11;
                const y = -0.4 + t * 0.65;
                const angle = t * Math.PI * 6; // 3 turns
                const r = 0.05 + t * 0.015;
                return (
                  <mesh key={i} position={[Math.cos(angle) * r, y, Math.sin(angle) * r]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.07, 6]} />
                    <meshStandardMaterial color={isIgnited ? "#475569" : "#94a3b8"} metalness={0.8} roughness={0.2} />
                  </mesh>
                );
              })}
            </group>

            {/* Match stick at bottom of spiral wire */}
            <mesh position={[0, -0.47, 0]}>
              <boxGeometry args={[0.012, 0.12, 0.012]} />
              <meshStandardMaterial color={matchColor} roughness={0.7} />
            </mesh>
            {/* Match head */}
            <mesh position={[0, -0.4, 0]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color={headColor} roughness={0.4} />
            </mesh>

            {/* Combustion glow and flying spark particles */}
            {isIgnited && (
              <group>
                {/* Core bright glow */}
                <group position={[0, -0.15, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
                  </mesh>
                  <mesh scale={[2.0, 2.0, 2.0]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color="#f97316" transparent opacity={0.45} />
                  </mesh>
                  <mesh scale={[3.0, 3.0, 3.0]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
                  </mesh>
                  <pointLight color="#f97316" intensity={4.5} distance={4} decay={1.8} />
                </group>

                {/* 3D Parabolic Flying Sparks */}
                {[...Array(18)].map((_, i) => {
                  const t = ((Date.now() * 0.0016 + i * 0.055) % 1.0);
                  const angle = (i * 137.5) * (Math.PI / 180);
                  const speed = 0.35 + 0.15 * Math.sin(i * 10);
                  const radius = t * speed;
                  
                  // Spark coordinates (fly out and fall downwards)
                  const sx = Math.cos(angle) * radius;
                  const sz = Math.sin(angle) * radius;
                  const sy = -0.15 - (t * t * 0.5) - t * 0.05;

                  return (
                    <mesh key={i} position={[sx, sy, sz]}>
                      <sphereGeometry args={[0.012 * (1.0 - t), 4, 4]} />
                      <meshBasicMaterial color="#f59e0b" />
                    </mesh>
                  );
                })}
              </group>
            )}
          </group>
        </group>
      );
    }
    case 'phosphorus-oxygen':
    case 'sulfur-oxygen': {
      const fuelColor = id === 'phosphorus-oxygen' ? '#ef4444' : '#fbbf24';
      const lightColor = id === 'phosphorus-oxygen' ? '#ffffff' : '#8b5cf6';
      return (
        <group position={[0, -0.15, 0]}>
          {/* Gas jar */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 1.6, 32, 1, true]} />
            {glassMat}
          </mesh>
          <mesh position={[0, -0.8, 0]} rotation={[Math.PI/2, 0, 0]}>
            <circleGeometry args={[0.6, 32]} />
            {glassMat}
          </mesh>
          {/* Water for SO₂ absorption / general protection */}
          <mesh position={[0, -0.73, 0]}>
            <cylinderGeometry args={[0.58, 0.58, 0.12, 32]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.05} transparent opacity={0.35} />
          </mesh>
          {/* Combustion spoon (燃烧匙) */}
          <group position={[0, 0.3, 0]}>
            {/* Handle rod */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 1.0, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Spoon cup */}
            <mesh position={[0, 0.0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.05, 16, 1, true]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
            </mesh>
            {/* Fuel sample in spoon */}
            <mesh position={[0, 0.01, 0]}>
              <sphereGeometry args={[0.08, 16, 10, 0, Math.PI*2, 0, Math.PI/2.5]} />
              <meshStandardMaterial color={fuelColor} roughness={0.5} />
            </mesh>
          </group>
          {/* Combustion glow */}
          {isIgnited && (
            <group position={[0, 0.28, 0]}>
              <mesh>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.14, 8, 8]} />
                <meshBasicMaterial color={lightColor} transparent opacity={0.45} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.22, 8, 8]} />
                <meshBasicMaterial color={lightColor} transparent opacity={0.18} />
              </mesh>
              <pointLight color={lightColor} intensity={3.5} distance={5} decay={2} />
            </group>
          )}
        </group>
      );
    }

    case 'co2-naoh': {
      const balloonR = 0.12 + Math.min(gasVolumeLeft / 60, 1) * 0.45;
      return (
        <group position={[0, -0.15, 0]}>
          {/* Round-bottom flask (圆底烧瓶) */}
          {/* Flask sphere body */}
          <mesh position={[0, -0.05, 0]}>
            <sphereGeometry args={[0.8, 32, 32, 0, Math.PI*2, 0, Math.PI*0.75]} />
            {glassMat}
          </mesh>
          {/* Flask neck (slender cylinder) */}
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.7, 32, 1, true]} />
            {glassMat}
          </mesh>
          {/* Rim at top of neck */}
          <mesh position={[0, 1.05, 0]}>
            <torusGeometry args={[0.2, 0.015, 8, 32]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.1} />
          </mesh>

          {/* NaOH solution at bottom of flask */}
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.22, 32]} />
            <meshStandardMaterial color="#f472b6" roughness={0.05} transparent opacity={0.18} />
          </mesh>

          {/* Balloon inside flask neck (expands as CO₂ is absorbed) */}
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[balloonR, 32, 32]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.3} />
          </mesh>
          {/* Balloon stem going up to stopper */}
          <mesh position={[0, 0.4 + balloonR * 0.4, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.3} />
          </mesh>

          {/* Two-hole rubber stopper */}
          <mesh position={[0, 0.96, 0]}>
            <cylinderGeometry args={[0.22, 0.18, 0.08, 16]} />
            <meshStandardMaterial color="#78716c" roughness={0.7} />
          </mesh>

          {/* Syringe with NaOH solution (注射器) */}
          <group position={[0.08, 1.1, 0]}>
            {/* Syringe barrel */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.4, 16, 1, true]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.1} transparent opacity={0.5} />
            </mesh>
            {/* Plunger */}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Plunger top disk */}
            <mesh position={[0, 0.43, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
              <meshStandardMaterial color="#ef4444" roughness={0.3} />
            </mesh>
            {/* Pink NaOH drop entering the flask (when injecting) */}
            {customAction === 'inject-naoh' && (
              <mesh position={[0, -0.3, 0]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshStandardMaterial color="#f472b6" roughness={0.05} transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        </group>
      );
    }

    case 'electrolysis-water': {
      // Calculate displaced water height for middle safety tube
      const totalGas = gasVolumeLeft + gasVolumeRight; // max is 45 + 22.5 = 67.5
      const hLeft = 1.4 * (1 - gasVolumeLeft / 45);
      const hRight = 1.4 * (1 - gasVolumeRight / 22.5);
      const hSafety = 0.8 + (totalGas / 67.5) * 0.5;

      const yLeft = -0.25 + hLeft / 2;
      const yRight = -0.25 + hRight / 2;
      const ySafety = -0.25 + hSafety / 2;

      const isPowerOn = currentStep >= 1 && (customAction === 'turn-on-power' || (parameters?.voltage ?? 0) > 0);

      return (
        <group position={[0, -0.4, 0]}>
          {/* Iron Stand Base & Rod */}
          <mesh position={[0, -0.5, -0.35]}>
            <boxGeometry args={[1.4, 0.04, 0.6]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.4, -0.35]}>
            <cylinderGeometry args={[0.02, 0.02, 1.8, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.1} />
          </mesh>
          {/* Clamp holding the U-tube */}
          <mesh position={[0, 0.5, -0.18]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.35, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Left Glass Tube */}
          <mesh position={[-0.4, 0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.6, 32, 1, true]} />
            {glassMat}
          </mesh>
          {/* Right Glass Tube */}
          <mesh position={[0.4, 0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.6, 32, 1, true]} />
            {glassMat}
          </mesh>
          {/* Middle Vertical Safety Tube */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.6, 24, 1, true]} />
            {glassMat}
          </mesh>
          {/* Reservoir Bulb Funnel at top of middle tube */}
          <mesh position={[0, 1.35, 0]}>
            <cylinderGeometry args={[0.18, 0.06, 0.3, 24, 1, true]} />
            {glassMat}
          </mesh>
          {/* Horizontal Bridge Tube */}
          <mesh position={[0, -0.25, 0]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.8, 16, 1, true]} />
            {glassMat}
          </mesh>

          {/* Water columns inside left/right tubes */}
          {hLeft > 0.01 && (
            <mesh position={[-0.4, yLeft, 0]}>
              <cylinderGeometry args={[0.11, 0.11, hLeft, 32]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.1} />
            </mesh>
          )}
          {hRight > 0.01 && (
            <mesh position={[0.4, yRight, 0]}>
              <cylinderGeometry args={[0.11, 0.11, hRight, 32]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.1} />
            </mesh>
          )}
          {/* Water column inside Middle Safety Tube */}
          <mesh position={[0, ySafety, 0]}>
            <cylinderGeometry args={[0.055, 0.055, hSafety, 16]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.1} />
          </mesh>
          {/* Water inside Reservoir Bulb (fills up as safety height increases) */}
          {hSafety > 1.25 && (
            <mesh position={[0, 1.25, 0]}>
              <cylinderGeometry args={[0.12, 0.055, 0.1, 16]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.1} />
            </mesh>
          )}
          <mesh position={[0, -0.25, 0]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.055, 0.055, 0.8, 16]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.1} />
          </mesh>

          {/* Graduations/Tick Marks on Left/Right Glass Tubes */}
          {Array.from({ length: 9 }).map((_, i) => {
            const ty = -0.25 + 0.15 * (i + 1); // ticks from y=-0.1 to y=1.1
            return (
              <group key={i}>
                {/* Left ticks */}
                <mesh position={[-0.4, ty, 0]} rotation={[Math.PI/2, 0, 0]}>
                  <torusGeometry args={[0.122, 0.003, 8, 24]} />
                  <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
                </mesh>
                {/* Right ticks */}
                <mesh position={[0.4, ty, 0]} rotation={[Math.PI/2, 0, 0]}>
                  <torusGeometry args={[0.122, 0.003, 8, 24]} />
                  <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
                </mesh>
              </group>
            );
          })}

          {/* Graphite Electrodes */}
          <mesh position={[-0.4, -0.42, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh position={[0.4, -0.42, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} metalness={0.2} />
          </mesh>

          {/* Wires (Represented as aesthetic angled cylinders) */}
          {/* Red wire (positive, right) */}
          <mesh position={[0.15, -0.58, 0.2]} rotation={[-0.3, -0.8, -0.15]}>
            <cylinderGeometry args={[0.012, 0.012, 0.65, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
          <mesh position={[-0.45, -0.63, 0.45]} rotation={[0.4, 0.9, 0.2]}>
            <cylinderGeometry args={[0.012, 0.012, 1.25, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>

          {/* Black wire (negative, left) */}
          <mesh position={[-0.8, -0.58, 0.25]} rotation={[0.3, 0.8, 0.15]}>
            <cylinderGeometry args={[0.012, 0.012, 0.85, 8]} />
            <meshStandardMaterial color="#000000" roughness={0.4} />
          </mesh>

          {/* DC Power Supply Box */}
          <mesh position={[-1.1, -0.58, 0.45]}>
            <boxGeometry args={[0.5, 0.38, 0.4]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.25} />
          </mesh>
          {/* Switch knob */}
          <mesh position={[-0.9, -0.55, 0.65]}>
            <boxGeometry args={[0.05, 0.05, 0.02]} />
            <meshStandardMaterial color={isPowerOn ? '#00ff9d' : '#ef4444'} emissive={isPowerOn ? '#00ff9d' : '#000000'} emissiveIntensity={0.6} />
          </mesh>
          {/* Terminals */}
          <mesh position={[-1.0, -0.65, 0.65]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
            <meshStandardMaterial color="#ef4444" metalness={0.5} />
          </mesh>
          <mesh position={[-1.2, -0.65, 0.65]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
            <meshStandardMaterial color="#000000" metalness={0.5} />
          </mesh>
          {/* Voltage display screen */}
          <mesh position={[-1.1, -0.45, 0.651]}>
            <boxGeometry args={[0.22, 0.09, 0.01]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <Html position={[-1.1, -0.45, 0.655]} transform distanceFactor={1.2}>
            <div style={{
              fontFamily: 'monospace',
              color: isPowerOn ? '#00ff9d' : '#475569',
              fontSize: '10px',
              fontWeight: 'bold',
              background: '#000',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid rgba(255,255,255,0.1)',
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              {isPowerOn ? '12.0V' : '0.0V'}
            </div>
          </Html>

          {/* Bubbles particle emitters inside columns */}
          <ElectrolysisBubbles position={[-0.4, 0, 0]} waterHeight={hLeft} rate={isPowerOn ? 2 : 0} />
          <ElectrolysisBubbles position={[0.4, 0, 0]} waterHeight={hRight} rate={isPowerOn ? 1 : 0} />

          {/* Drei Clickable html placards */}
          <Html position={[-0.4, 1.4, 0]} center distanceFactor={2.4}>
            <div 
              onClick={() => setShowCathodeLabel && setShowCathodeLabel(!showCathodeLabel)}
              style={{
                background: 'rgba(10, 15, 30, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 243, 255, 0.3)',
                boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#00f3ff',
                fontSize: '10px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                opacity: showCathodeLabel ? 1 : 0.4,
                transition: 'opacity 0.2s',
                userSelect: 'none'
              }}
            >
              阴极 H₂ {showCathodeLabel && '(体积大)'}
            </div>
          </Html>

          <Html position={[0.4, 1.4, 0]} center distanceFactor={2.4}>
            <div 
              onClick={() => setShowAnodeLabel && setShowAnodeLabel(!showAnodeLabel)}
              style={{
                background: 'rgba(10, 15, 30, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#10b981',
                fontSize: '10px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                opacity: showAnodeLabel ? 1 : 0.4,
                transition: 'opacity 0.2s',
                userSelect: 'none'
              }}
            >
              阳极 O₂ {showAnodeLabel && '(体积小)'}
            </div>
          </Html>

          {/* Water Trough / Basin at the bottom */}
          <mesh position={[0, -0.68, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.2, 32, 1, true]} />
            {glassMat}
          </mesh>
          <mesh position={[0, -0.78, 0]} rotation={[Math.PI/2, 0, 0]}>
            <circleGeometry args={[0.6, 32]} />
            {glassMat}
          </mesh>
          <mesh position={[0, -0.69, 0]}>
            <cylinderGeometry args={[0.59, 0.59, 0.18, 32]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.22} roughness={0.1} />
          </mesh>
        </group>
      );
    }

    case 'salt-purification': {
      if (currentStage === 'dissolve') {
        return (
          <group position={[-0.44, -0.4, 0]}>
            {/* Beaker */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 1.4, 32, 1, true]} />
              {glassMat}
            </mesh>
            <mesh position={[0, -0.2, 0]} rotation={[Math.PI/2, 0, 0]}>
              <circleGeometry args={[0.8, 32]} />
              {glassMat}
            </mesh>

            {/* Liquid level */}
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.79, 0.79, 0.8, 32]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.25} roughness={0.1} />
            </mesh>

            {/* Glass rod */}
            <group position={[0, 0.6, 0]} rotation={[0, 0, stirring ? Math.sin(Date.now() * 0.01) * 0.12 : -0.15]}>
              <mesh position={[0.2, 0.2, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.05} />
              </mesh>
            </group>
          </group>
        );
      } else if (currentStage === 'filter') {
        return (
          <group position={[-0.55, -0.35, 0]}>
            {/* Iron stand with ring (铁架台 + 铁圈) */}
            <mesh position={[0.4, -0.75, 0]}>
              <boxGeometry args={[0.4, 0.05, 0.3]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0.4, -0.1, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 1.3, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Clamp holder connector */}
            <mesh position={[0.225, 0.15, 0]} rotation={[0, 0, Math.PI/2]}>
              <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Iron ring holding funnel */}
            <mesh position={[0.05, 0.15, 0]}>
              <torusGeometry args={[0.22, 0.02, 8, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Funnel (漏斗) */}
            <group position={[0.05, 0.18, 0]}>
              <mesh position={[0, 0.3, 0]}>
                <coneGeometry args={[0.4, 0.4, 32, 1, true]} />
                {glassMat}
              </mesh>
              {/* Funnel stem */}
              <mesh position={[0, -0.05, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.35, 16, 1, true]} />
                {glassMat}
              </mesh>
              {/* Filter paper (folded cone) */}
              <mesh position={[0, 0.32, 0]}>
                <coneGeometry args={[0.38, 0.36, 24]} />
                <meshStandardMaterial color="#fefefe" roughness={0.85} />
              </mesh>
            </group>

            {/* Beaker receiving filtrate - placed such that funnel stem tip touches its right inner wall */}
            <group position={[-0.35, -0.5, 0]}>
              <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.65, 32, 1, true]} />
                {glassMat}
              </mesh>
              <mesh position={[0, -0.12, 0]} rotation={[Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.4, 32]} />
                {glassMat}
              </mesh>
              {/* Filtrate collecting at bottom */}
              <mesh position={[0, 0.0, 0]}>
                <cylinderGeometry args={[0.38, 0.38, 0.25, 32]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.05} transparent opacity={0.18} />
              </mesh>
            </group>

            {/* Glass rod for guiding liquid (玻璃棒引流) - tilted, resting inside the funnel */}
            <mesh position={[0.18, 0.45, 0.02]} rotation={[0, 0, -0.7]}>
              <cylinderGeometry args={[0.018, 0.018, 0.8, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.05} transparent opacity={0.6} />
            </mesh>

            {/* Beaker above pouring mixture (烧杯嘴靠玻璃棒) */}
            <group position={[0.36, 0.62, 0]} rotation={[0, 0, 0.9]}>
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.32, 0.32, 0.55, 32, 1, true]} />
                {glassMat}
              </mesh>
              <mesh position={[0, -0.12, 0]} rotation={[Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.32, 32]} />
                {glassMat}
              </mesh>
              {/* Murky mixture */}
              <mesh position={[0, 0.0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.28, 32]} />
                <meshStandardMaterial color="#a1a1aa" roughness={0.1} transparent opacity={0.25} />
              </mesh>
            </group>

            {/* Guiding liquid stream running down glass rod */}
            {customAction === 'start-filtration' && (
              <mesh position={[0.16, 0.43, 0.01]} rotation={[0, 0, -0.7]}>
                <cylinderGeometry args={[0.01, 0.01, 0.38, 8]} />
                <meshStandardMaterial color="#a1a1aa" transparent opacity={0.6} />
              </mesh>
            )}

            {/* Liquid drops falling from funnel stem */}
            {customAction === 'start-filtration' && (
              <group>
                {[0, 1, 2].map((i) => {
                  const t = ((Date.now() * 0.002 + i * 0.33) % 1);
                  return (
                    <mesh key={i} position={[0.05, -0.08 - t * 0.25, 0]}>
                      <sphereGeometry args={[0.018, 6, 6]} />
                      <meshStandardMaterial color="#3b82f6" roughness={0.05} transparent opacity={0.6} />
                    </mesh>
                  );
                })}
              </group>
            )}
          </group>
        );
      } else {
        // Evaporate Stage
        return (
          <group position={[-0.44, -0.4, 0]}>
            {/* Evaporating Dish Bowl */}
            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.7, 32, 16, 0, Math.PI*2, Math.PI/2, Math.PI/2]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>

            {/* Evaporating Liquid inside dish */}
            <mesh position={[0, 0.38, 0]} scale={[1, 1 - dissolveProgress/100, 1]}>
              <sphereGeometry args={[0.68, 32, 8, 0, Math.PI*2, Math.PI/2, Math.PI/6]} />
              <meshStandardMaterial color="#3b82f6" transparent opacity={0.25} roughness={0.1} />
            </mesh>

            {/* Precipitating NaCl salt crystals inside dish (increases with progress) */}
            {dissolveProgress > 10 && (
              <group position={[0, 0.35, 0]}>
                {/* Render tiny white spheres at bottom representing salt crystals */}
                <mesh position={[-0.15, -0.02, 0.1]} scale={[1, 1, 1]}>
                  <sphereGeometry args={[0.04 * (dissolveProgress/100), 6, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </mesh>
                <mesh position={[0.2, -0.03, -0.1]} scale={[1.2, 1.2, 1.2]}>
                  <sphereGeometry args={[0.035 * (dissolveProgress/100), 6, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </mesh>
                <mesh position={[-0.05, -0.04, -0.15]}>
                  <sphereGeometry args={[0.045 * (dissolveProgress/100), 6, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </mesh>
                <mesh position={[0.1, -0.03, 0.2]}>
                  <sphereGeometry args={[0.038 * (dissolveProgress/100), 6, 6]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </mesh>
              </group>
            )}

            {/* 3D Tripod (三脚架) */}
            {/* Top Ring */}
            <mesh position={[0, 0.36, 0]}>
              <torusGeometry args={[0.65, 0.04, 8, 24]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Tripod Legs */}
            <mesh position={[0, -0.17, 0.58]} rotation={[0.25, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 1.1, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-0.5, -0.17, -0.29]} rotation={[-0.125, 0, 0.22]}>
              <cylinderGeometry args={[0.03, 0.03, 1.1, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.5, -0.17, -0.29]} rotation={[-0.125, 0, -0.22]}>
              <cylinderGeometry args={[0.03, 0.03, 1.1, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Clay Triangle (泥三角) supporting evaporating dish */}
            <mesh position={[0, 0.39, 0.32]}>
              <boxGeometry args={[0.6, 0.03, 0.03]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
            </mesh>
            <mesh position={[-0.16, 0.39, -0.16]} rotation={[0, Math.PI/3, 0]}>
              <boxGeometry args={[0.6, 0.03, 0.03]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
            </mesh>
            <mesh position={[0.16, 0.39, -0.16]} rotation={[0, -Math.PI/3, 0]}>
              <boxGeometry args={[0.6, 0.03, 0.03]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
            </mesh>

            {/* Alcohol burner below */}
            <group position={[0, -0.3, 0]}>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.25, 0.35, 0.4, 32]} />
                <meshStandardMaterial color="#475569" transparent opacity={0.6} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} />
              </mesh>
              {isHeating && (
                <group position={[0, 0.35, 0]}>
                  {/* Outer flame */}
                  <mesh scale={[1, 1.3 + 0.2 * Math.sin(Date.now() * 0.03), 1]}>
                    <coneGeometry args={[0.1, 0.3, 16]} />
                    <meshBasicMaterial color="#f97316" />
                  </mesh>
                  {/* Inner flame */}
                  <mesh position={[0, -0.05, 0]} scale={[0.8, 1.0, 0.8]}>
                    <coneGeometry args={[0.06, 0.2, 16]} />
                    <meshBasicMaterial color="#fef08a" />
                  </mesh>
                  <pointLight color="#f97316" intensity={2.5} distance={3} />
                </group>
              )}
            </group>
          </group>
        );
      }
    }

    case 'co2-lab': {
      const showLitmus = customAction === 'litmus-test';
      const litmusColor = ph < 6 ? '#ef4444' : '#a78bfa';
      return (
        <group position={[0, -0.15, 0]}>
          {/* ====== CONICAL FLASK (锥形瓶) ====== */}
          <group position={[-1.3, 0, 0]}>
            {/* Flask body: tapered - wider at bottom, narrower at top */}
            <mesh position={[0, -0.1, 0]}>
              <cylinderGeometry args={[0.55, 0.28, 1.0, 32, 1, true]} />
              {glassMat}
            </mesh>
            {/* Flask flat bottom */}
            <mesh position={[0, -0.6, 0]} rotation={[Math.PI/2, 0, 0]}>
              <circleGeometry args={[0.55, 32]} />
              {glassMat}
            </mesh>
            {/* Flask neck (slender, cylindrical) */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.3, 24, 1, true]} />
              {glassMat}
            </mesh>
            {/* Marble chips at bottom */}
            {reagentsAdded && (
              <>
                <mesh position={[-0.12, -0.45, 0.1]}>
                  <sphereGeometry args={[0.12, 6, 4]} />
                  <meshStandardMaterial color="#a8a29e" roughness={0.7} />
                </mesh>
                <mesh position={[0.14, -0.5, -0.08]}>
                  <sphereGeometry args={[0.09, 6, 4]} />
                  <meshStandardMaterial color="#9ca3af" roughness={0.7} />
                </mesh>
                <mesh position={[0.0, -0.4, 0.16]}>
                  <sphereGeometry args={[0.1, 6, 4]} />
                  <meshStandardMaterial color="#a1a1aa" roughness={0.7} />
                </mesh>
                {/* HCl liquid level */}
                <mesh position={[0, -0.25, 0]}>
                  <cylinderGeometry args={[0.48, 0.26, 0.4, 32]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.05} transparent opacity={0.15} />
                </mesh>
              </>
            )}

            {/* Two-hole rubber stopper with physical holes */}
            {reagentsAdded && (
              <>
                <mesh position={[0, 0.65, 0]}>
                  <cylinderGeometry args={[0.18, 0.14, 0.1, 16]} />
                  <meshStandardMaterial color="#78716c" roughness={0.75} />
                </mesh>
                {/* Left Hole (for Thistle Funnel) */}
                <mesh position={[-0.06, 0.65, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.105, 8]} />
                  <meshBasicMaterial color="#1c1917" />
                </mesh>
                {/* Right Hole (for Delivery Tube) */}
                <mesh position={[0.06, 0.65, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.105, 8]} />
                  <meshBasicMaterial color="#1c1917" />
                </mesh>
              </>
            )}

            {/* Long-neck thistle funnel (长颈漏斗) - stem goes DEEP BELOW liquid for liquid seal */}
            {reagentsAdded && (
              <group position={[-0.06, 0.65, 0]}>
                {/* Funnel bowl (top) */}
                <mesh position={[0, 0.22, 0]}>
                  <cylinderGeometry args={[0.14, 0.05, 0.2, 16, 1, true]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.05} transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
                {/* Funnel stem going down into liquid */}
                <mesh position={[0, -0.38, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 1.0, 12]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.05} transparent opacity={0.55} />
                </mesh>
              </group>
            )}
          </group>

          {/* ====== DELIVERY TUBE (平滑连续弯曲导管) ====== */}
          {reagentsAdded && (
            <group>
              {showLitmus ? (
                <>
                  {/* Tube 1: From flask right hole to left test tube top */}
                  <mesh>
                    <tubeGeometry args={[
                      new THREE.CatmullRomCurve3([
                        new THREE.Vector3(-1.24, 0.60, 0),
                        new THREE.Vector3(-1.24, 0.88, 0),
                        new THREE.Vector3(-1.18, 0.95, 0),
                        new THREE.Vector3(0.72, 0.95, 0),
                        new THREE.Vector3(0.8, 0.88, 0),
                        new THREE.Vector3(0.8, 0.67, 0)
                      ]), 32, 0.02, 8, false
                    ]} />
                    {glassMat}
                  </mesh>
                  {/* Tube 2: Branch to right test tube top */}
                  <mesh>
                    <tubeGeometry args={[
                      new THREE.CatmullRomCurve3([
                        new THREE.Vector3(0.8, 0.95, 0),
                        new THREE.Vector3(1.22, 0.95, 0),
                        new THREE.Vector3(1.3, 0.88, 0),
                        new THREE.Vector3(1.3, 0.67, 0)
                      ]), 16, 0.02, 8, false
                    ]} />
                    {glassMat}
                  </mesh>
                </>
              ) : (
                /* Tube to candle jar */
                <mesh>
                  <tubeGeometry args={[
                    new THREE.CatmullRomCurve3([
                      new THREE.Vector3(-1.24, 0.60, 0),
                      new THREE.Vector3(-1.24, 0.93, 0),
                      new THREE.Vector3(-1.18, 1.00, 0),
                      new THREE.Vector3(1.45, 1.00, 0),
                      new THREE.Vector3(1.53, 0.93, 0),
                      new THREE.Vector3(1.53, 0.85, 0)
                    ]), 64, 0.02, 8, false
                  ]} />
                  {glassMat}
                </mesh>
              )}
            </group>
          )}

          {/* ====== TARGET CONTAINER ====== */}
          {showLitmus ? (
            /* Litmus test tube + 澄清石灰水 */
            <group position={[1.05, -0.05, 0]}>
              {/* Litmus tube (left) */}
              <group position={[-0.25, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.18, 0.18, 1.1, 32, 1, true]} />
                  {glassMat}
                </mesh>
                <mesh position={[0, -0.55, 0]} rotation={[Math.PI/2, 0, 0]}>
                  <circleGeometry args={[0.18, 32]} />
                  {glassMat}
                </mesh>
                {/* Litmus solution */}
                <mesh position={[0, -0.2, 0]}>
                  <cylinderGeometry args={[0.17, 0.17, 0.7, 32]} />
                  <meshStandardMaterial color={litmusColor} roughness={0.05} transparent opacity={0.35} />
                </mesh>
                {/* Gas inlet tube going to bottom */}
                <mesh position={[0, 0.42, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.05} transparent opacity={0.5} />
                </mesh>
              </group>
              {/* Lime water tube (right) - 澄清石灰水变浑浊 */}
              <group position={[0.25, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.18, 0.18, 1.1, 32, 1, true]} />
                  {glassMat}
                </mesh>
                <mesh position={[0, -0.55, 0]} rotation={[Math.PI/2, 0, 0]}>
                  <circleGeometry args={[0.18, 32]} />
                  {glassMat}
                </mesh>
                {/* Lime water - clear, turning cloudy */}
                <mesh position={[0, -0.2, 0]}>
                  <cylinderGeometry args={[0.17, 0.17, 0.7, 32]} />
                  <meshStandardMaterial color={ph < 5 ? '#e2e8f0' : '#ffffff'} roughness={0.05} transparent opacity={ph < 5 ? 0.4 : 0.15} />
                </mesh>
                <mesh position={[0, 0.42, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.05} transparent opacity={0.5} />
                </mesh>
              </group>
              {/* CO₂ bubbles in tubes */}
              {currentStep >= 3 && (
                <>
                  <mesh position={[-0.23, -0.3 + Math.sin(Date.now()*0.003)*0.4, 0.05]}>
                    <sphereGeometry args={[0.015, 6, 6]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.1} transparent opacity={0.5} />
                  </mesh>
                  <mesh position={[0.27, -0.2 + Math.sin(Date.now()*0.004)*0.3, -0.04]}>
                    <sphereGeometry args={[0.015, 6, 6]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.1} transparent opacity={0.5} />
                  </mesh>
                </>
              )}
            </group>
          ) : (
            /* Candle jar: CO₂ collects at bottom, extinguishes lower candle first */
            <group position={[1.05, -0.1, 0]}>
              {/* Wide glass jar */}
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 1.5, 32, 1, true]} />
                {glassMat}
              </mesh>
              <mesh position={[0, -0.7, 0]} rotation={[Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.5, 32]} />
                {glassMat}
              </mesh>
              {/* Gas inlet tube going to jar bottom (向上排空气法) */}
              {reagentsAdded && (
                <mesh position={[0.48, 0.45, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.05} transparent opacity={0.5} />
                </mesh>
              )}
              {/* CO₂ layer accumulating at bottom (faint grey fog) */}
              {co2Poured > 0 && (
                <mesh position={[0, -0.7 + (1.45*co2Poured/100)/2, 0]}>
                  <cylinderGeometry args={[0.48, 0.48, 1.45*co2Poured/100, 32]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.1} transparent opacity={0.07} />
                </mesh>
              )}

              {/* Short candle (left, lower height - extinguishes first) */}
              <group position={[-0.14, -0.35, 0]}>
                <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.22, 16]} />
                  <meshStandardMaterial color="#fef3c7" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.23, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.05, 6]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                {candleHeightLow > 0 && (
                  <group position={[0, 0.28, 0]}>
                    <mesh position={[0, 0.01, 0]}>
                      <sphereGeometry args={[0.025, 6, 6]} />
                      <meshBasicMaterial color="#bfdbfe" />
                    </mesh>
                    <mesh position={[0, 0.0, 0]}>
                      <sphereGeometry args={[0.035, 6, 6]} />
                      <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
                    </mesh>
                    <pointLight color="#fbbf24" intensity={0.6} distance={1.5} />
                  </group>
                )}
              </group>

              {/* Tall candle (right, higher height) */}
              <group position={[0.14, -0.15, 0]}>
                <mesh position={[0, 0.2, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.42, 16]} />
                  <meshStandardMaterial color="#fef3c7" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.43, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.05, 6]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                {candleHeightHigh > 0 && (
                  <group position={[0, 0.48, 0]}>
                    <mesh position={[0, 0.01, 0]}>
                      <sphereGeometry args={[0.025, 6, 6]} />
                      <meshBasicMaterial color="#bfdbfe" />
                    </mesh>
                    <mesh position={[0, 0.0, 0]}>
                      <sphereGeometry args={[0.035, 6, 6]} />
                      <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
                    </mesh>
                    <pointLight color="#fbbf24" intensity={0.6} distance={1.5} />
                  </group>
                )}
              </group>
            </group>
          )}
        </group>
      );
    }

    case 'metal-reactions': {
      const centers = [-1.78, -0.61, 0.55, 1.72];
      const polishedColors = ['#e2e8f0', '#cbd5e1', '#a1a1aa', '#ea580c'];
      const oxidizedColors = ['#4b5563', '#374151', '#451a03', '#78350f'];

      return (
        <group position={[0, -0.3, 0]}>
          {centers.map((c, idx) => {
            const isDropped = customAction === 'drop-metals';
            const color = metalPolished ? polishedColors[idx] : oxidizedColors[idx];

            return (
              <group key={idx} position={[c, 0, 0]}>
                {/* Test tube */}
                <mesh position={[0, 0.3, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 1.4, 32, 1, true]} />
                  {glassMat}
                </mesh>
                <mesh position={[0, -0.4, 0]} rotation={[Math.PI/2, 0, 0]}>
                  <circleGeometry args={[0.2, 32]} />
                  {glassMat}
                </mesh>

                {/* Acid solution */}
                {reagentsAdded && (
                  <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.19, 0.19, 0.9, 32]} />
                    <meshStandardMaterial color="rgba(239, 68, 68, 0.15)" transparent opacity={0.2} roughness={0.1} />
                  </mesh>
                )}

                {/* Metal Strip */}
                <mesh position={[0, isDropped ? 0.05 : 1.2, 0]}>
                  <boxGeometry args={[0.08, 0.6, 0.02]} />
                  <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} />
                </mesh>
              </group>
            );
          })}
        </group>
      );
    }

    case 'combustion-conditions': {
      const isCpBurning = currentStep >= 1 && apparatusAssembled;
      const isUwBurning = currentStep === 2 && customAction === 'bubble-oxygen' && isPlaying;

      return (
        <group position={[0, -0.3, 0]}>
          {/* Large beaker with hot water */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.95, 0.95, 1.1, 32, 1, true]} />
            {glassMat}
          </mesh>
          <mesh position={[0, -0.25, 0]} rotation={[Math.PI/2, 0, 0]}>
            <circleGeometry args={[0.95, 32]} />
            {glassMat}
          </mesh>
          {/* Hot water (80°C) */}
          {apparatusAssembled && (
            <>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.93, 0.93, 0.7, 32]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.03} transparent opacity={0.18} />
              </mesh>
              {/* Steam rising */}
              <mesh position={[0.1 + Math.sin(Date.now()*0.002)*0.1, 0.45 + Math.cos(Date.now()*0.003)*0.2, 0.15]}>
                <sphereGeometry args={[0.04, 4, 4]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} transparent opacity={0.12} />
              </mesh>
              <mesh position={[-0.08 + Math.cos(Date.now()*0.0025)*0.08, 0.5 + Math.sin(Date.now()*0.002)*0.15, -0.1]}>
                <sphereGeometry args={[0.03, 4, 4]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} transparent opacity={0.1} />
              </mesh>

              {/* Copper plate on top of beaker */}
              <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[1.8, 0.03, 0.35]} />
                <meshStandardMaterial color="#ea580c" roughness={0.3} metalness={0.6} />
              </mesh>

              {/* White phosphorus on copper plate (left side) */}
              <mesh position={[-0.55, 0.835, 0]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color="#fef08a" roughness={0.4} />
              </mesh>

              {/* White phosphorus combustion flame (left side) */}
              {isCpBurning && (
                <group position={[-0.55, 0.835, 0]}>
                  {/* Outer flame */}
                  <mesh position={[0, 0.08, 0]} scale={[1, 1.4 + 0.2 * Math.sin(Date.now() * 0.035), 1]}>
                    <coneGeometry args={[0.06, 0.22, 8]} />
                    <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
                  </mesh>
                  {/* Inner flame */}
                  <mesh position={[0, 0.05, 0]} scale={[1, 1.25 + 0.15 * Math.sin(Date.now() * 0.04), 1]}>
                    <coneGeometry args={[0.04, 0.14, 8]} />
                    <meshBasicMaterial color="#fbbf24" />
                  </mesh>
                  <pointLight color="#fbbf24" intensity={2.5} distance={1.8} />
                  
                  {/* P2O5 white smoke cloud rising */}
                  {[0, 1, 2, 3].map((i) => {
                    const t = ((Date.now() * 0.0006 + i * 0.25) % 1);
                    const sy = 0.1 + t * 0.6;
                    const sx = (Math.sin(i * 7) * 0.15) * t;
                    const sz = (Math.cos(i * 7) * 0.15) * t;
                    const scale = 0.3 + t * 1.5;
                    return (
                      <mesh key={i} position={[sx, sy, sz]} scale={[scale, scale, scale]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial color="#f8fafc" transparent opacity={0.4 * (1 - t)} roughness={0.9} />
                      </mesh>
                    );
                  })}
                </group>
              )}

              {/* Red phosphorus on copper plate (right side) - NOT burning */}
              <mesh position={[0.55, 0.835, 0]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color="#991b1b" roughness={0.4} />
              </mesh>

              {/* White phosphorus underwater (beaker bottom) */}
              <mesh position={[0, -0.21, 0]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color="#fef08a" roughness={0.4} />
              </mesh>

              {/* Oxygen delivery nozzle dipping into water (only during bubbling/combustion) */}
              {currentStep === 2 && (
                <group>
                  <mesh>
                    <tubeGeometry args={[
                      new THREE.CatmullRomCurve3([
                        new THREE.Vector3(1.2, 0.9, 0),
                        new THREE.Vector3(0.88, 0.9, 0),
                        new THREE.Vector3(0.85, 0.85, 0),
                        new THREE.Vector3(0.85, -0.15, 0),
                        new THREE.Vector3(0.80, -0.22, 0),
                        new THREE.Vector3(0.12, -0.22, 0)
                      ]), 32, 0.015, 8, false
                    ]} />
                    {glassMat}
                  </mesh>

                  {/* Rising oxygen bubble particles */}
                  {customAction === 'bubble-oxygen' && (
                    <>
                      {[0, 1, 2, 3].map((i) => {
                        const t = ((Date.now() * 0.0008 + i * 0.25) % 1);
                        const bx = 0.12 - t * 0.12;
                        const by = -0.22 + t * 0.62;
                        return (
                          <mesh key={i} position={[bx, by, 0.02 * Math.sin(i * 10)]}>
                            <sphereGeometry args={[0.02 + 0.01 * Math.sin(t * Math.PI), 8, 8]} />
                            <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.1} />
                          </mesh>
                        );
                      })}
                    </>
                  )}
                </group>
              )}

              {/* Underwater white phosphorus burning light */}
              {isUwBurning && (
                <group position={[0, -0.21, 0]}>
                  {/* Flashing center */}
                  <mesh scale={[1.1 + 0.15 * Math.sin(Date.now() * 0.08), 1.1 + 0.15 * Math.sin(Date.now() * 0.08), 1.1 + 0.15 * Math.sin(Date.now() * 0.08)]}>
                    <sphereGeometry args={[0.08, 12, 12]} />
                    <meshBasicMaterial color="#fef08a" />
                  </mesh>
                  {/* Outer glow */}
                  <mesh scale={[1.6 + 0.25 * Math.cos(Date.now() * 0.08), 1.6 + 0.25 * Math.cos(Date.now() * 0.08), 1.6 + 0.25 * Math.cos(Date.now() * 0.08)]}>
                    <sphereGeometry args={[0.1, 12, 12]} />
                    <meshBasicMaterial color="#ea580c" transparent opacity={0.65} />
                  </mesh>
                  <pointLight color="#f97316" intensity={4.5} distance={1.5} />
                </group>
              )}
            </>
          )}
        </group>
      );
    }

    case 'nacl-solution': {
      const waterPct = waterMeasured / 90.0;
      const saltPct = naclWeighed / 10.0;
      return (
        <group position={[0, -0.35, 0]}>
          {/* ====== TRAY BALANCE (托盘天平) ====== */}
          <group position={[-2.0, 0.45, 0]}>
            {/* Base */}
            <mesh position={[0, -0.4, 0]}>
              <boxGeometry args={[0.7, 0.06, 0.4]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Central pillar */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 1.0, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.15} />
            </mesh>
            {/* Beam (tilts based on weight) */}
            <mesh position={[0, 0.68, 0]} rotation={[0, 0, Math.sin(Date.now()*0.005) * (saltPct - 0.5) * 0.08]}>
              <boxGeometry args={[1.1, 0.03, 0.05]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Left pan (salt) */}
            <mesh position={[-0.4, 0.45, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Right pan (weights) */}
            <mesh position={[0.4, 0.45, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Salt pile on left pan */}
            {saltPct > 0 && (
              <mesh position={[-0.4, 0.48, 0]}>
                <sphereGeometry args={[0.06 * saltPct + 0.03, 8, 6]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.7} />
              </mesh>
            )}
            {/* Weights on right pan */}
            <mesh position={[0.4, 0.48, 0.1]}>
              <cylinderGeometry args={[0.04, 0.04, 0.05, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.36, 0.48, -0.08]}>
              <cylinderGeometry args={[0.04, 0.04, 0.05, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>

          {/* ====== GRADUATED CYLINDER (量筒) ====== */}
          <group position={[-0.4, 0.2, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 1.1, 24, 1, true]} />
              {glassMat}
            </mesh>
            {/* Base */}
            <mesh position={[0, -0.48, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.06, 24]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
            </mesh>
            {/* Water column */}
            {waterMeasured > 0 && (
              <mesh position={[0, -0.45 + (1.0 * waterPct)/2, 0]}>
                <cylinderGeometry args={[0.17, 0.17, 1.0 * waterPct, 24]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.03} transparent opacity={0.3} />
              </mesh>
            )}
            {/* Meniscus and markings */}
            {waterMeasured > 0 && (
              <mesh position={[0, -0.45 + 1.0 * waterPct, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.004, 24]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.03} transparent opacity={0.3} />
              </mesh>
            )}
          </group>

          {/* ====== BEAKER (烧杯 + 动态液面 + 溶解晶体 + 锥形旋转搅拌棒) ====== */}
          <group position={[1.7, 0.15, 0]}>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.65, 0.65, 1.0, 32, 1, true]} />
              {glassMat}
            </mesh>
            <mesh position={[0, -0.35, 0]} rotation={[Math.PI/2, 0, 0]}>
              <circleGeometry args={[0.65, 32]} />
              {glassMat}
            </mesh>
            
            {/* Dynamic rising water solution level */}
            {waterPct > 0 && (
              <mesh position={[0, -0.35 + (0.6 * waterPct)/2, 0]}>
                <cylinderGeometry args={[0.63, 0.63, 0.6 * waterPct, 32]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.03} transparent opacity={0.15} />
              </mesh>
            )}

            {/* Salt pile at bottom (shrinks as dissolveProgress increases) */}
            {saltPct > 0 && dissolveProgress < 99 && (
              <mesh 
                position={[0, -0.34, 0]} 
                scale={[1 - dissolveProgress/100, 0.6 * (1 - dissolveProgress/100), 1 - dissolveProgress/100]}
              >
                <sphereGeometry args={[0.3, 16, 8, 0, Math.PI*2, 0, Math.PI/2]} />
                <meshStandardMaterial color="#ffffff" roughness={0.7} />
              </mesh>
            )}

            {/* Glass stirring rod - performs realistic conical circular motion when stirring */}
            <group 
              position={[0, 0.3, 0]} 
              rotation={[
                stirring ? 0.08 * Math.sin(Date.now() * 0.015) : 0, 
                0, 
                stirring ? 0.08 * Math.cos(Date.now() * 0.015) : -0.12
              ]}
            >
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.85, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.03} transparent opacity={0.5} />
              </mesh>
            </group>
          </group>

          {/* ====== MEDICINE SPOON (药匙) ====== */}
          <mesh position={[-1.3, 0.0, 0]}>
            <boxGeometry args={[0.02, 0.008, 0.3]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-1.2, 0.0, 0]}>
            <cylinderGeometry args={[0.025, 0.06, 0.05, 8, 1, true]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      );
    }

    case 'acid-base': {
      // Delay color transition until drop lands in the solution
      let activePh = ph;
      if (isDropping && dropY > -0.54) {
        if (customAction === 'drop-acid') {
          activePh = Math.min(14, ph + 1.2); // keep it basic/neutral longer
        } else if (customAction === 'drop-base') {
          activePh = Math.max(1, ph - 1.2); // keep it acidic/neutral longer
        }
      }

      let solColor = 'rgba(59, 130, 246, 0.08)';
      if (litmusAdded) {
        if (activePh < 6) solColor = 'rgba(239, 68, 68, 0.3)';
        else if (activePh > 8) solColor = 'rgba(59, 130, 246, 0.3)';
        else solColor = 'rgba(167, 139, 250, 0.25)';
      } else if (phenolphthaleinAdded) {
        if (activePh > 8) solColor = 'rgba(244, 114, 182, 0.35)';
        else solColor = 'rgba(255, 255, 255, 0.05)';
      }

      // Bulb squeeze calculation
      const bulbSqueezeY = isDropping ? Math.min(1.0, 0.7 + 0.3 * (1 - (dropY - (-0.3)) / -0.25)) : 1.0;

      return (
        <group position={[0, -0.3, 0]}>
          {/* Beaker */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 1.2, 32, 1, true]} />
            {glassMat}
          </mesh>
          <mesh position={[0, -0.3, 0]} rotation={[Math.PI/2, 0, 0]}>
            <circleGeometry args={[0.7, 32]} />
            {glassMat}
          </mesh>
          {/* Solution with dynamic color */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.7, 32]} />
            <meshStandardMaterial color={solColor} roughness={0.05} transparent opacity={0.9} />
          </mesh>

          {/* Dropper (胶头滴管) */}
          <group position={[0.15, 0.95, 0]}>
            {/* Rubber bulb with squeeze animation */}
            <mesh position={[0, 0.12, 0]} scale={[1, bulbSqueezeY, 1]}>
              <sphereGeometry args={[0.06, 12, 8]} />
              <meshStandardMaterial color="#f43f5e" roughness={0.4} />
            </mesh>
            {/* Glass tube */}
            <mesh position={[0, -0.1, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.05} transparent opacity={0.5} />
            </mesh>
            {/* Dynamic Drop falling */}
            {isDropping && (
              <mesh position={[0, dropY, 0]}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshStandardMaterial color={customAction === 'drop-acid' ? '#ef4444' : '#c084fc'} roughness={0.05} transparent opacity={0.7} />
              </mesh>
            )}
          </group>

          {/* Glass stirring rod */}
          <group position={[0.05, 0.3, 0]} rotation={[0, 0, stirring ? Math.sin(Date.now()*0.01)*0.1 : -0.08]}>
            <mesh position={[0.15, 0.15, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.03} transparent opacity={0.5} />
            </mesh>
          </group>

          {/* pH indicator label */}
          <mesh position={[0, 1.0, 0.01]}>
            <planeGeometry args={[0.02, 0.02]} />
            <meshBasicMaterial color={ph < 6 ? '#ef4444' : ph > 8 ? '#3b82f6' : '#a78bfa'} />
          </mesh>
        </group>
      );
    }

    default:
      return null;
  }
};

const CameraController: React.FC<{
  currentStep: number;
  experimentId: string;
  isEnlarged: boolean;
  controlsRef: React.RefObject<any>;
}> = ({ currentStep, experimentId, isEnlarged, controlsRef }) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0.4, 2.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.1, 0));

  useEffect(() => {
    let pos = [0, 0.4, 2.8];
    let look = [0, 0.1, 0];

    if (experimentId === 'electrolysis-water') {
      if (isEnlarged) {
        pos = [0, -0.25, 1.4];
        look = [0, -0.4, 0];
      } else {
        switch (currentStep) {
          case 0:
            pos = [0, 0.8, 1.8];
            look = [0, 0.6, 0];
            break;
          case 1:
            pos = [0, 0.1, 2.0];
            look = [0, -0.1, 0];
            break;
          case 2:
            pos = [0, 0.9, 1.6];
            look = [0, 0.8, 0];
            break;
          default:
            pos = [0, 0.4, 2.6];
            look = [0, 0.1, 0];
        }
      }
    } else {
      if (isEnlarged) {
        pos = [0, 0.0, 1.5];
        look = [0, -0.25, 0];
      }
    }

    targetPos.current.set(pos[0], pos[1], pos[2]);
    targetLookAt.current.set(look[0], look[1], look[2]);
  }, [currentStep, experimentId, isEnlarged]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      controlsRef.current.update();
    }
  });

  return null;
};

const ElectrolysisBubbles: React.FC<{
  position: [number, number, number];
  waterHeight: number;
  rate: number;
}> = ({ position, waterHeight, rate }) => {
  const bubblesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!bubblesRef.current || rate === 0) return;
    const time = state.clock.getElapsedTime();
    const children = bubblesRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      const speed = 0.5 + (i * 0.1);
      const minY = -0.45;
      const maxY = -0.25 + waterHeight;
      if (maxY > minY) {
        const t = (time * speed + i * 0.2) % 1;
        mesh.position.y = minY + t * (maxY - minY);
        mesh.position.x = Math.sin(time * 2 + i) * 0.03;
        mesh.position.z = Math.cos(time * 2 + i) * 0.03;
        mesh.scale.setScalar(0.4 + Math.sin(time * 5 + i) * 0.15);
      } else {
        mesh.position.y = -99;
      }
    }
  });

  return (
    <group position={position} ref={bubblesRef}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, -99, 0]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.05} />
        </mesh>
      ))}
    </group>
  );
};

const ThreeDLab: React.FC<ThreeDLabProps> = ({
  experimentId,
  stateRef,
  isHeating,
  isIgnited,
  tubeRemoved,
  selectedFuel,
  currentStage,
  metalPolished,
  reagentsAdded,
  customAction,
  apparatusAssembled,
  currentStep,
  stirring,
  litmusAdded,
  phenolphthaleinAdded,
  isPlaying,
  isEnlarged,
  parameters
}) => {
  const [ph, setPh] = useState(7.0);
  const [gasVolumeLeft, setGasVolumeLeft] = useState(0);
  const [gasVolumeRight, setGasVolumeRight] = useState(0);
  const [waterMeasured, setWaterMeasured] = useState(0);
  const [naclWeighed, setNaclWeighed] = useState(0);
  const [candleHeightLow, setCandleHeightLow] = useState(1.0);
  const [candleHeightHigh, setCandleHeightHigh] = useState(1.0);
  const [co2Poured, setCo2Poured] = useState(0);
  const [reactionProgress, setReactionProgress] = useState(0);

  // Local droplet animation states
  const [dropY, setDropY] = useState(-0.3);
  const [isDropping, setIsDropping] = useState(false);
  const controlsRef = useRef<any>(null);
  const [showCathodeLabel, setShowCathodeLabel] = useState(true);
  const [showAnodeLabel, setShowAnodeLabel] = useState(true);

  // Sync state values on every frame
  useFrame(() => {
    const s = stateRef.current;
    if (s) {
      setPh(s.ph);
      setGasVolumeLeft(s.gasVolumeLeft);
      setGasVolumeRight(s.gasVolumeRight);
      setWaterMeasured(s.waterMeasured);
      setNaclWeighed(s.naclWeighed);
      setCandleHeightLow(s.candleHeightLow);
      setCandleHeightHigh(s.candleHeightHigh);
      setCo2Poured(s.co2Poured);
      setReactionProgress(s.reactionProgress);
    }

    // Animate acid-base indicator drop
    if (isPlaying && (customAction === 'drop-acid' || customAction === 'drop-base')) {
      if (!isDropping) {
        setIsDropping(true);
        setDropY(-0.3); // Dropper tip relative position
      } else {
        setDropY((prev) => {
          const next = prev - 0.012; // slow, smooth fall
          if (next <= -0.55) {
            // Reached solution surface
            return -0.55;
          }
          return next;
        });
      }
    } else {
      if (isDropping) {
        setIsDropping(false);
        setDropY(-0.3);
      }
    }
  });

  const glassMat = (
    <meshPhysicalMaterial
      roughness={0.05}
      metalness={0}
      transmission={0.55}
      thickness={0.8}
      ior={1.45}
      transparent
      opacity={0.75}
      color="#e8f4fd"
      clearcoat={0.3}
      specularIntensity={0.4}
      specularColor="#ffffff"
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Orbit controls for zoom/drag */}
      <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} minDistance={1.0} maxDistance={8.0} />
      <CameraController currentStep={currentStep} experimentId={experimentId} isEnlarged={isEnlarged} controlsRef={controlsRef} />
      <Environment preset="city" />

      {/* 3D Lab Apparatus Geometries */}
      {renderApparatus(
        experimentId,
        glassMat,
        isHeating,
        isIgnited,
        tubeRemoved,
        selectedFuel,
        currentStage,
        metalPolished,
        reagentsAdded,
        customAction,
        apparatusAssembled,
        currentStep,
        stirring,
        litmusAdded,
        phenolphthaleinAdded,
        ph,
        gasVolumeLeft,
        gasVolumeRight,
        waterMeasured,
        naclWeighed,
        candleHeightLow,
        candleHeightHigh,
        co2Poured,
        reactionProgress,
        dropY,
        isDropping,
        isPlaying,
        showCathodeLabel,
        setShowCathodeLabel,
        showAnodeLabel,
        setShowAnodeLabel,
        parameters
      )}
    </>
  );
};

interface MicroscopicVisualizerProps {
  experimentId: string;
  isPlaying: boolean;
  simSpeed: number;
  customAction: string;
  currentStep: number;
  stateRef: React.MutableRefObject<any>;
}

export const MicroscopicVisualizer: React.FC<MicroscopicVisualizerProps> = ({
  experimentId,
  isPlaying,
  simSpeed,
  customAction,
  currentStep,
  stateRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(4.0); // 2x - 10x
  const [speed, setSpeed] = useState(1.0); // 0.1x - 2.0x
  const [showTrajectories, setShowTrajectories] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const particlesRef = useRef<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const particles: any[] = [];
    let id = 0;

    if (experimentId === 'electrolysis-water') {
      for (let i = 0; i < 40; i++) {
        particles.push({
          id: id++,
          x: 40 + Math.random() * 320,
          y: 40 + Math.random() * 220,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          radius: 8,
          color: '#ef4444',
          label: 'H₂O',
          type: 'H2O',
          h1Offset: { x: -6, y: 5 },
          h2Offset: { x: 6, y: 5 },
          trail: []
        });
      }
    } else if (experimentId === 'acid-base') {
      for (let i = 0; i < 15; i++) {
        particles.push({
          id: id++,
          x: 20 + Math.random() * 160,
          y: 30 + Math.random() * 240,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 4,
          color: '#ef4444',
          label: 'H⁺',
          type: 'H+',
          trail: []
        });
        particles.push({
          id: id++,
          x: 20 + Math.random() * 160,
          y: 30 + Math.random() * 240,
          vx: (Math.random() - 0.5) * 1.0,
          vy: (Math.random() - 0.5) * 1.0,
          radius: 6,
          color: '#f97316',
          label: 'Cl⁻',
          type: 'Cl-',
          trail: []
        });
        particles.push({
          id: id++,
          x: 220 + Math.random() * 160,
          y: 30 + Math.random() * 240,
          vx: (Math.random() - 0.5) * 1.0,
          vy: (Math.random() - 0.5) * 1.0,
          radius: 6,
          color: '#c084fc',
          label: 'Na⁺',
          type: 'Na+',
          trail: []
        });
        particles.push({
          id: id++,
          x: 220 + Math.random() * 160,
          y: 30 + Math.random() * 240,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 4,
          color: '#f472b6',
          label: 'OH⁻',
          type: 'OH-',
          trail: []
        });
      }
    } else {
      for (let i = 0; i < 20; i++) {
        particles.push({
          id: id++,
          x: 20 + Math.random() * 360,
          y: 20 + Math.random() * 260,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 5,
          color: '#ef4444',
          label: 'A',
          type: 'reactantA',
          trail: []
        });
        particles.push({
          id: id++,
          x: 20 + Math.random() * 360,
          y: 20 + Math.random() * 260,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 5,
          color: '#3b82f6',
          label: 'B',
          type: 'reactantB',
          trail: []
        });
      }
    }
    particlesRef.current = particles;
  }, [experimentId]);

  useEffect(() => {
    let animFrame: number;
    
    const updatePhysics = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const parts = particlesRef.current;
      const stepSpeed = speed * simSpeed * (isPlaying ? 1.0 : 0.0);

      if (stepSpeed > 0) {
        parts.forEach((p) => {
          p.x += p.vx * stepSpeed;
          p.y += p.vy * stepSpeed;

          if (experimentId === 'electrolysis-water') {
            if (p.type === 'H2' || p.type === 'O2') {
              p.vy -= 0.03 * stepSpeed;
              p.vx += (Math.random() - 0.5) * 0.1 * stepSpeed;
            }
          }

          if (p.x - p.radius < 0) {
            p.x = p.radius;
            p.vx = -p.vx;
          } else if (p.x + p.radius > width) {
            p.x = width - p.radius;
            p.vx = -p.vx;
          }

          if (p.y - p.radius < 0) {
            if (experimentId === 'electrolysis-water' && (p.type === 'H2' || p.type === 'O2')) {
              p.y = height - p.radius - 10;
              p.x = 20 + Math.random() * (width - 40);
              p.vy = -0.5 - Math.random() * 0.5;
            } else {
              p.y = p.radius;
              p.vy = -p.vy;
            }
          } else if (p.y + p.radius > height) {
            p.y = height - p.radius;
            p.vy = -p.vy;
          }

          if (showTrajectories) {
            p.trail = p.trail || [];
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 8) p.trail.shift();
          } else {
            p.trail = [];
          }
        });

        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            const p1 = parts[i];
            const p2 = parts[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const minDist = p1.radius + p2.radius;

            if (dist < minDist && dist > 0) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              p1.x -= nx * overlap * 0.5;
              p1.y -= ny * overlap * 0.5;
              p2.x += nx * overlap * 0.5;
              p2.y += ny * overlap * 0.5;

              const m1 = p1.radius;
              const m2 = p2.radius;
              const kx = p1.vx - p2.vx;
              const ky = p1.vy - p2.vy;
              const impulse = (2 * (kx * nx + ky * ny)) / (m1 + m2);

              p1.vx -= impulse * m2 * nx;
              p1.vy -= impulse * m2 * ny;
              p2.vx += impulse * m1 * nx;
              p2.vy += impulse * m1 * ny;

              if (experimentId === 'acid-base') {
                if ((p1.type === 'H+' && p2.type === 'OH-') || (p1.type === 'OH-' && p2.type === 'H+')) {
                  const h = p1.type === 'H+' ? p1 : p2;
                  const oh = p1.type === 'OH-' ? p1 : p2;
                  h.type = 'H2O';
                  h.label = 'H₂O';
                  h.color = '#3b82f6';
                  h.radius = 7;
                  h.h1Offset = { x: -5, y: 4 };
                  h.h2Offset = { x: 5, y: 4 };
                  const otherIndex = parts.indexOf(oh);
                  if (otherIndex > -1) {
                    parts.splice(otherIndex, 1);
                  }
                  break;
                }
              }

              if (experimentId !== 'electrolysis-water' && experimentId !== 'acid-base') {
                if ((p1.type === 'reactantA' && p2.type === 'reactantB') || (p1.type === 'reactantB' && p2.type === 'reactantA')) {
                  const rA = p1.type === 'reactantA' ? p1 : p2;
                  const rB = p1.type === 'reactantB' ? p1 : p2;
                  rA.type = 'productAB';
                  rA.label = 'AB';
                  rA.color = '#10b981';
                  rA.radius = 7;
                  const otherIndex = parts.indexOf(rB);
                  if (otherIndex > -1) {
                    parts.splice(otherIndex, 1);
                  }
                  break;
                }
              }
            }
          }
        }

        if (experimentId === 'electrolysis-water' && (customAction === 'turn-on-power' || currentStep >= 1)) {
          if (Math.random() < 0.005 * stepSpeed) {
            const h2oIndex = parts.findIndex((p) => p.type === 'H2O');
            if (h2oIndex > -1) {
              const h2o = parts[h2oIndex];
              parts.splice(h2oIndex, 1);

              const idBase = Date.now() + Math.random() * 1000;
              parts.push({
                id: idBase + 1,
                x: h2o.x - 10,
                y: h2o.y,
                vx: -1.0 + Math.random() * 2.0,
                vy: -1.0 + Math.random() * 2.0,
                radius: 4.5,
                color: '#3b82f6',
                label: 'H',
                type: 'H',
                trail: []
              });
              parts.push({
                id: idBase + 2,
                x: h2o.x + 10,
                y: h2o.y,
                vx: -1.0 + Math.random() * 2.0,
                vy: -1.0 + Math.random() * 2.0,
                radius: 4.5,
                color: '#3b82f6',
                label: 'H',
                type: 'H',
                trail: []
              });
              parts.push({
                id: idBase + 3,
                x: h2o.x,
                y: h2o.y + 5,
                vx: -0.5 + Math.random() * 1.0,
                vy: -0.5 + Math.random() * 1.0,
                radius: 6.5,
                color: '#10b981',
                label: 'O',
                type: 'O',
                trail: []
              });
            }
          }

          for (let i = 0; i < parts.length; i++) {
            if (parts[i].type !== 'H') continue;
            for (let j = i + 1; j < parts.length; j++) {
              if (parts[j].type !== 'H') continue;
              const h1 = parts[i];
              const h2 = parts[j];
              const dx = h2.x - h1.x;
              const dy = h2.y - h1.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < 18) {
                h1.type = 'H2';
                h1.label = 'H₂';
                h1.color = '#38bdf8';
                h1.radius = 6.5;
                h1.h1Offset = { x: -4, y: 0 };
                h1.h2Offset = { x: 4, y: 0 };
                parts.splice(parts.indexOf(h2), 1);
                break;
              }
            }
          }

          for (let i = 0; i < parts.length; i++) {
            if (parts[i].type !== 'O') continue;
            for (let j = i + 1; j < parts.length; j++) {
              if (parts[j].type !== 'O') continue;
              const o1 = parts[i];
              const o2 = parts[j];
              const dx = o2.x - o1.x;
              const dy = o2.y - o1.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < 20) {
                o1.type = 'O2';
                o1.label = 'O₂';
                o1.color = '#4ade80';
                o1.radius = 8.5;
                o1.o1Offset = { x: -5, y: 0 };
                o1.o2Offset = { x: 5, y: 0 };
                parts.splice(parts.indexOf(o2), 1);
                break;
              }
            }
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom / 4.0, zoom / 4.0);
      ctx.translate(-width / 2, -height / 2);

      if (showTrajectories) {
        parts.forEach((p) => {
          if (p.trail && p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let k = 1; k < p.trail.length; k++) {
              ctx.lineTo(p.trail[k].x, p.trail[k].y);
            }
            ctx.strokeStyle = p.color + '25';
            ctx.lineWidth = p.radius * 0.8;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        });
      }

      parts.forEach((p) => {
        if (p.type === 'H2O') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.h1Offset.x, p.y + p.h1Offset.y);
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.h2Offset.x, p.y + p.h2Offset.y);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(p.x + p.h1Offset.x, p.y + p.h1Offset.y, 3.8, 0, Math.PI * 2);
          ctx.arc(p.x + p.h2Offset.x, p.y + p.h2Offset.y, 3.8, 0, Math.PI * 2);
          ctx.fill();
        } 
        else if (p.type === 'H2') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x + p.h1Offset.x, p.y + p.h1Offset.y);
          ctx.lineTo(p.x + p.h2Offset.x, p.y + p.h2Offset.y);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(p.x + p.h1Offset.x, p.y + p.h1Offset.y, 3.8, 0, Math.PI * 2);
          ctx.arc(p.x + p.h2Offset.x, p.y + p.h2Offset.y, 3.8, 0, Math.PI * 2);
          ctx.fill();
        } 
        else if (p.type === 'O2') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(p.x + p.o1Offset.x, p.y - 1.5 + p.o1Offset.y);
          ctx.lineTo(p.x + p.o2Offset.x, p.y - 1.5 + p.o2Offset.y);
          ctx.moveTo(p.x + p.o1Offset.x, p.y + 1.5 + p.o1Offset.y);
          ctx.lineTo(p.x + p.o2Offset.x, p.y + 1.5 + p.o2Offset.y);
          ctx.stroke();

          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(p.x + p.o1Offset.x, p.y + p.o1Offset.y, 6.0, 0, Math.PI * 2);
          ctx.arc(p.x + p.o2Offset.x, p.y + p.o2Offset.y, 6.0, 0, Math.PI * 2);
          ctx.fill();
        } 
        else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px Outfit, var(--font-sans)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.label, p.x, p.y + 0.5);
        }
      });

      ctx.restore();

      const newStats: Record<string, number> = {};
      parts.forEach((p) => {
        newStats[p.label] = (newStats[p.label] || 0) + 1;
      });

      if (experimentId === 'electrolysis-water') {
        const h2o = parts.filter(p => p.type === 'H2O').length;
        const h2 = parts.filter(p => p.type === 'H2').length;
        const o2 = parts.filter(p => p.type === 'O2').length;
        const h = parts.filter(p => p.type === 'H').length;
        const o = parts.filter(p => p.type === 'O').length;
        setStats({
          'H₂O (水分子)': h2o,
          'H₂ (氢气分子)': h2,
          'O₂ (氧气分子)': o2,
          'H (自由氢原子)': h,
          'O (自由氧原子)': o,
        });
      } else if (experimentId === 'acid-base') {
        const hp = parts.filter(p => p.type === 'H+').length;
        const oh = parts.filter(p => p.type === 'OH-').length;
        const h2o = parts.filter(p => p.type === 'H2O').length;
        const na = parts.filter(p => p.type === 'Na+').length;
        const cl = parts.filter(p => p.type === 'Cl-').length;
        setStats({
          'H⁺ (氢离子)': hp,
          'OH⁻ (氢氧根离子)': oh,
          'H₂O (生成的水)': h2o,
          'Na⁺ (钠离子)': na,
          'Cl⁻ (氯离子)': cl
        });
      } else {
        setStats(newStats);
      }

      animFrame = requestAnimationFrame(updatePhysics);
    };

    updatePhysics();
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, simSpeed, speed, zoom, showTrajectories, experimentId, customAction, currentStep]);

  const resetLocalSim = () => {
    const particles: any[] = [];
    let id = 0;

    if (experimentId === 'electrolysis-water') {
      for (let i = 0; i < 40; i++) {
        particles.push({
          id: id++,
          x: 40 + Math.random() * 320,
          y: 40 + Math.random() * 220,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          radius: 8,
          color: '#ef4444',
          label: 'H₂O',
          type: 'H2O',
          h1Offset: { x: -6, y: 5 },
          h2Offset: { x: 6, y: 5 },
          trail: []
        });
      }
    } else if (experimentId === 'acid-base') {
      for (let i = 0; i < 15; i++) {
        particles.push({ id: id++, x: 20+Math.random()*160, y: 30+Math.random()*240, vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5, radius: 4, color: '#ef4444', label: 'H⁺', type: 'H+', trail: [] });
        particles.push({ id: id++, x: 20+Math.random()*160, y: 30+Math.random()*240, vx: (Math.random()-0.5)*1.0, vy: (Math.random()-0.5)*1.0, radius: 6, color: '#f97316', label: 'Cl⁻', type: 'Cl-', trail: [] });
        particles.push({ id: id++, x: 220+Math.random()*160, y: 30+Math.random()*240, vx: (Math.random()-0.5)*1.0, vy: (Math.random()-0.5)*1.0, radius: 6, color: '#c084fc', label: 'Na⁺', type: 'Na+', trail: [] });
        particles.push({ id: id++, x: 220+Math.random()*160, y: 30+Math.random()*240, vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5, radius: 4, color: '#f472b6', label: 'OH⁻', type: 'OH-', trail: [] });
      }
    } else {
      for (let i = 0; i < 20; i++) {
        particles.push({ id: id++, x: 20+Math.random()*360, y: 20+Math.random()*260, vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5, radius: 5, color: '#ef4444', label: 'A', type: 'reactantA', trail: [] });
        particles.push({ id: id++, x: 20+Math.random()*360, y: 20+Math.random()*260, vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5, radius: 5, color: '#3b82f6', label: 'B', type: 'reactantB', trail: [] });
      }
    }
    particlesRef.current = particles;
  };

  const containerStyle: React.CSSProperties = isFullscreen ? {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    backgroundColor: '#0a0b10',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    gap: '16px'
  } : {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(10, 12, 18, 0.95)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="var(--accent)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
            微观粒子模拟器 (Kinetic Engine)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setIsFullscreen(prev => !prev)}
            style={{
              padding: '4px 10px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isFullscreen ? '退出全屏' : '全屏观察'}
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#020306',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            backgroundColor: '#010204',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'block'
          }}
        />

        <div style={{
          position: 'absolute',
          left: '20px',
          top: '20px',
          backgroundColor: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 10
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '2px' }}>
            实时粒子统计
          </div>
          {Object.entries(stats).map(([label, count]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '0.72rem', color: '#e2e8f0' }}>
              <span>{label}:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--success)' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              <span>粒子缩放 (Zoom):</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{(zoom / 4.0).toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="10" 
              step="0.5"
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                outline: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              <span>运动速度 (Speed):</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{speed.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.1"
              value={speed} 
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                outline: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showTrajectories} 
              onChange={(e) => setShowTrajectories(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            显示碰撞轨迹 (Trails)
          </label>

          <button 
            onClick={resetLocalSim}
            style={{
              padding: '6px 14px',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
          >
            <RotateCcw size={12} />
            重置粒子
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChemistryLab: React.FC<ChemistryLabProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData,
  experimentId
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Local state for actions not mapped to global parameters
  const [isHeating, setIsHeating] = useState(false);
  const [isIgnited, setIsIgnited] = useState(false);
  const [stirring, setStirring] = useState(false);
  const [customAction, setCustomAction] = useState<string>(''); // Used for bubble oxygen, inject NaOH, drop metals
  const [currentStage, setCurrentStage] = useState<'dissolve' | 'filter' | 'evaporate'>('dissolve'); // For crude salt
  const [litmusAdded, setLitmusAdded] = useState(false);
  const [phenolphthaleinAdded, setPhenolphthaleinAdded] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<'Fe' | 'P' | 'S'>('Fe'); // For combined oxygen lab
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [isEnlarged, setIsEnlarged] = useState(false);

  // Interactive experimental steps state machine
  const [currentStep, setCurrentStep] = useState(0);
  const [isShattered, setIsShattered] = useState(false);
  const [airtightChecked, setAirtightChecked] = useState(false);
  const [reagentsAdded, setReagentsAdded] = useState(false);
  const [tubeRemoved, setTubeRemoved] = useState(false);
  const [ignitedMatch, setIgnitedMatch] = useState(false);
  const [sandPoured, setSandPoured] = useState(false);
  const [metalPolished, setMetalPolished] = useState(false);
  const [apparatusAssembled, setApparatusAssembled] = useState(false);

  // Simulation state kept in a ref for the animation loop
  const stateRef = useRef({
    particles: [] as Particle[],
    temperature: 20, // °C
    ph: 7.0,
    gasVolumeLeft: 0, // mL
    gasVolumeRight: 0, // mL
    waterLevel: 100, // %
    pressure: 1.0, // atm
    balloonSize: 10, // px radius
    naclWeighed: 0, // g
    waterMeasured: 0, // mL
    massFraction: 0, // %
    saltPurity: 50, // %
    reactionProgress: 0,
    time: 0,
    lastRecordTime: 0,
    litmusColor: '#a78bfa', // default light purple
    phenolphthaleinColor: 'rgba(255, 255, 255, 0.15)', // colorless
    candleHeightLow: 1.0, // 0 to 1
    candleHeightHigh: 1.0, // 0 to 1
    litmusTestTubeColor: 'rgba(167, 139, 250, 0.3)', // light purple
    co2Poured: 0, // % filled in candle jar
    initialized: false
  });

  // Reset simulation state when experiment changes
  const resetLab = () => {
    stateRef.current.initialized = false;
    setIsHeating(false);
    setIsIgnited(false);
    setStirring(false);
    setCustomAction('');
    setCurrentStage('dissolve');
    setLitmusAdded(false);
    setPhenolphthaleinAdded(false);
    
    // Reset steps state machine
    setCurrentStep(0);
    setIsShattered(false);
    setAirtightChecked(false);
    setReagentsAdded(false);
    setTubeRemoved(false);
    setIgnitedMatch(false);
    setSandPoured(false);
    setMetalPolished(false);
    setApparatusAssembled(false);

    stateRef.current.temperature = 20;
    stateRef.current.gasVolumeLeft = 0;
    stateRef.current.gasVolumeRight = 0;
    stateRef.current.waterLevel = 100;
    stateRef.current.pressure = 1.0;
    stateRef.current.balloonSize = 10;
    stateRef.current.naclWeighed = 0;
    stateRef.current.waterMeasured = 0;
    stateRef.current.massFraction = 0;
    stateRef.current.saltPurity = 50;
    stateRef.current.reactionProgress = 0;
    stateRef.current.ph = 7.0;
    stateRef.current.candleHeightLow = 1.0;
    stateRef.current.candleHeightHigh = 1.0;
    stateRef.current.co2Poured = 0;
    stateRef.current.litmusTestTubeColor = 'rgba(167, 139, 250, 0.3)';
  };

  useEffect(() => {
    resetLab();
  }, [experimentId]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const initParticles = () => {
      const parts: Particle[] = [];
      let id = 0;

      const createParticle = (x: number, y: number, label: string, color: string, type: Particle['type'], radius = 6): Particle => ({
        id: id++,
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius,
        color,
        label,
        type
      });

      if (experimentId === 'kclo3-oxygen') {
        stateRef.current.temperature = 20; stateRef.current.gasVolumeLeft = 0;
        for (let i = 0; i < 25; i++) parts.push(createParticle(195 + (i%5)*7 + Math.random()*3, 118 + Math.floor(i/5)*7 + Math.random()*3, 'KClO₃','#ffffff','reactant',4.5));
        const cnt = parameters.catalystAmount??5; for(let i=0;i<cnt;i++) parts.push(createParticle(196+Math.random()*26,120+Math.random()*9,'MnO₂','#3b3b3b','catalyst',5));
      } else if (experimentId === 'iron-oxygen') {
        stateRef.current.temperature = 20; stateRef.current.reactionProgress = 0;
        const o2a = parameters.oxygenPurity??30; for(let i=0;i<o2a;i++) parts.push(createParticle(255+Math.random()*130,100+Math.random()*140,'O₂','#38bdf8','reactant',4.5));
        for(let i=0;i<20;i++) parts.push({ id:id++, x:322+Math.sin(i*1.6)*13, y:85+i*7, vx:0,vy:0, radius:4, color:'#94a3b8', label:'Fe', type:'reactant' });
      } else if (experimentId === 'phosphorus-oxygen') {
        const o2a=parameters.oxygenPurity??30; for(let i=0;i<o2a;i++) parts.push(createParticle(255+Math.random()*130,100+Math.random()*140,'O₂','#38bdf8','reactant',4.5));
        for(let i=0;i<15;i++) parts.push(createParticle(310+Math.random()*20,155+Math.random()*8,'P','#ef4444','reactant',4));
      } else if (experimentId === 'sulfur-oxygen') {
        const o2a=parameters.oxygenPurity??30; for(let i=0;i<o2a;i++) parts.push(createParticle(255+Math.random()*130,100+Math.random()*140,'O₂','#38bdf8','reactant',4.5));
        for(let i=0;i<15;i++) parts.push(createParticle(310+Math.random()*20,155+Math.random()*8,'S','#fbbf24','reactant',4));
      } else if (experimentId === 'co2-naoh') {
        stateRef.current.pressure=1.0; stateRef.current.balloonSize=12;
        for(let i=0;i<30;i++) parts.push(createParticle(255+Math.random()*130,115+Math.random()*95,'CO₂','#94a3b8','reactant',4.5));
        for(let i=0;i<15;i++){ parts.push(createParticle(255+Math.random()*130,218+Math.random()*22,'Na⁺','#c084fc','solvent',4)); parts.push(createParticle(255+Math.random()*130,218+Math.random()*22,'OH⁻','#f472b6','solvent',4)); }
      } else if (experimentId === 'electrolysis-water') {
        stateRef.current.gasVolumeLeft=0; stateRef.current.gasVolumeRight=0;
        for(let i=0;i<20;i++) parts.push(createParticle(148+Math.random()*18,105+Math.random()*115,'H₂O','#3b82f6','solvent',4));
        for(let i=0;i<20;i++) parts.push(createParticle(238+Math.random()*18,105+Math.random()*115,'H₂O','#3b82f6','solvent',4));
        for(let i=0;i<5;i++){ parts.push(createParticle(148+Math.random()*18,155+Math.random()*55,'H⁺','#ef4444','reactant',3.5)); parts.push(createParticle(238+Math.random()*18,155+Math.random()*55,'SO₄²⁻','#10b981','solvent',5)); }
      } else if (experimentId === 'salt-purification') {
        stateRef.current.saltPurity=50;
        for(let i=0;i<20;i++){ parts.push({ id:id++, x:235+Math.random()*95, y:218+Math.random()*12, vx:0,vy:0, radius:7, color:'#b45309', label:'泥沙', type:'catalyst' }); parts.push({ id:id++, x:235+Math.random()*95, y:208+Math.random()*22, vx:(Math.random()-0.5)*0.5, vy:(Math.random()-0.5)*0.5, radius:4.5, color:'#e2e8f0', label:'NaCl', type:'reactant' }); }
      } else if (experimentId === 'oxygen-lab') {
        stateRef.current.temperature=20; stateRef.current.gasVolumeLeft=0; stateRef.current.reactionProgress=0;
        for(let i=0;i<20;i++) parts.push(createParticle(194+(i%5)*7+Math.random()*3,120+Math.floor(i/5)*7+Math.random()*3,'KClO₃','#ffffff','reactant',4.5));
        for(let i=0;i<4;i++) parts.push(createParticle(196+Math.random()*24,122+Math.random()*8,'MnO₂','#3b3b3b','catalyst',5));
      } else if (experimentId === 'co2-lab') {
        stateRef.current.temperature=20; stateRef.current.co2Poured=0; stateRef.current.candleHeightLow=1.0; stateRef.current.candleHeightHigh=1.0;
        for(let i=0;i<8;i++) parts.push({ id:id++, x:96+(i%3)*16+Math.random()*4, y:205+Math.floor(i/3)*8, vx:0,vy:0, radius:8, color:'#a1a1aa', label:'CaCO₃', type:'reactant' });
      } else if (experimentId === 'metal-reactions') {
        const ctrs=[130,260,390,520]; ctrs.forEach(c=>{ for(let i=0;i<12;i++) parts.push(createParticle(c-15+Math.random()*30,145+Math.random()*85,'H⁺','#ef4444','reactant',3.5)); });
      } else if (experimentId === 'combustion-conditions') {
        stateRef.current.temperature=20;
        parts.push({ id:id++, x:165,y:133, vx:0,vy:0, radius:8, color:'#fef08a', label:'白磷', type:'reactant' });
        parts.push({ id:id++, x:235,y:133, vx:0,vy:0, radius:8, color:'#b91c1c', label:'红磷', type:'reactant' });
        parts.push({ id:id++, x:200,y:223, vx:0,vy:0, radius:8, color:'#fef08a', label:'白磷', type:'reactant' });
        for(let i=0;i<15;i++) parts.push(createParticle(110+Math.random()*180,42+Math.random()*65,'O₂','#38bdf8','solvent',4.5));
      } else if (experimentId === 'nacl-solution') {
        stateRef.current.naclWeighed=0; stateRef.current.waterMeasured=0; stateRef.current.massFraction=0;
      } else if (experimentId === 'acid-base') {
        stateRef.current.ph=7.0; stateRef.current.temperature=20;
        for(let i=0;i<20;i++) parts.push(createParticle(235+Math.random()*90,155+Math.random()*75,'H₂O','#3b82f6','solvent',4));
      }

      stateRef.current.particles = parts;
      stateRef.current.initialized = true;
    };

    if (!stateRef.current.initialized) {
      initParticles();
    }

    const drawCracks = (cx: number, cy: number, size: number) => {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + (Math.random() - 0.5) * 0.2;
        ctx.moveTo(cx, cy);
        let px = cx; let py = cy;
        for (let j = 0; j < 3; j++) {
          const segLen = (size / 3) * (0.8 + Math.random() * 0.4);
          px += Math.cos(angle) * segLen;
          py += Math.sin(angle) * segLen + (Math.random() - 0.5) * 3;
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const s = stateRef.current;
      const speed = simSpeed;

      ctx.clearRect(0, 0, w, h);

      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // Increment physical timer
      if (isPlaying) {
        s.time += 0.05 * speed;
      }

      // ============================================
      // EXPERIMENT SPECIFIC UPDATES AND DRAWINGS
      // ============================================

// === KCLO3-OXYGEN: 氯酸钾制取氧气 (固固加热 + 排水集气法) ===
if (experimentId === 'kclo3-oxygen') {
  // --- Iron Stand (铁架台) ---
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(68, 278, 40, 6); // base plate
  ctx.fillStyle = '#334155';
  ctx.fillRect(85, 70, 5, 208); // vertical rod

  // --- Test Tube (试管, 口略向下倾斜 ~11°) ---
  const tubeMouthX = 155, tubeMouthY = 132;
  const tubeBotX = 238, tubeBotY = 120;
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tubeMouthX, tubeMouthY - 13);
  ctx.lineTo(tubeBotX, tubeBotY - 13);
  ctx.arc(tubeBotX, tubeBotY, 13, -Math.PI/2, Math.PI/2);
  ctx.lineTo(tubeMouthX, tubeMouthY + 13);
  ctx.stroke();

  // Rubber stopper
  ctx.fillStyle = '#78716c';
  ctx.fillRect(tubeMouthX - 2, tubeMouthY - 14, 8, 28);
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 1;
  ctx.strokeRect(tubeMouthX - 2, tubeMouthY - 14, 8, 28);

  // KClO₃ + MnO₂ powder at tube bottom
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(tubeBotX - 5, tubeBotY - 2, 11, 0, Math.PI);
  ctx.fill();
  if (currentStep >= 1 || reagentsAdded) {
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.arc(tubeBotX - 10, tubeBotY - 6, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(tubeBotX + 2, tubeBotY - 4, 2.5, 0, Math.PI*2); ctx.fill();
  }

  // --- Alcohol Burner (酒精灯) with flame layers ---
  ctx.fillStyle = '#475569';
  ctx.fillRect(tubeBotX - 28, 186, 28, 16);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(tubeBotX - 18, 178, 8, 8);
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(tubeBotX - 15, 170, 2, 8);
  if (isHeating && isPlaying) {
    s.temperature = Math.min(450, s.temperature + 1.5 * speed);
    ctx.fillStyle = '#bfdbfe';
    ctx.beginPath();
    ctx.moveTo(tubeBotX - 20, 170);
    ctx.quadraticCurveTo(tubeBotX - 14, 138 + Math.random()*8, tubeBotX - 8, 170);
    ctx.fill();
    ctx.fillStyle = 'rgba(249,115,22,0.7)';
    ctx.beginPath();
    ctx.moveTo(tubeBotX - 24, 170);
    ctx.quadraticCurveTo(tubeBotX - 14, 125 + Math.random()*12, tubeBotX - 4, 170);
    ctx.fill();
    if (currentStep === 2 && s.temperature > 240) { setCurrentStep(3); setCustomAction('collect-gas'); }
  } else { s.temperature = Math.max(20, s.temperature - 1.0 * speed); }

  // --- Delivery Tube (弯曲导气管, 4段) ---
  const isTubeIn = !tubeRemoved;
  const tSX = tubeMouthX - 3, tSY = tubeMouthY;
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(tSX, tSY);
  const b1x = tSX - 22, b1y = tSY - 24;
  ctx.lineTo(b1x, b1y);
  const b2x = 290, b2y = b1y;
  ctx.lineTo(b2x, b2y);
  if (isTubeIn) { ctx.lineTo(b2x, 258); }
  else { ctx.lineTo(b2x - 35, b2y + 55); }
  ctx.stroke();

  // Airtight check bubbles
  if (customAction === 'check-seal') {
    ctx.fillStyle = 'rgba(56,189,248,0.7)';
    ctx.beginPath();
    ctx.arc(b2x + 2 + Math.sin(s.time*8)*3, 252 - (s.time*28)%22, 4, 0, Math.PI*2);
    ctx.fill();
  }

  // --- Water Trough (水槽) ---
  ctx.fillStyle = 'rgba(59,130,246,0.1)';
  ctx.fillRect(265, 210, 140, 48);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(265, 210, 140, 48);

  // --- Beehive Shelf (蜂巢架) ---
  ctx.fillStyle = '#d6d3d1';
  ctx.fillRect(b2x + 12, 225, 28, 5);
  ctx.fillStyle = '#44403c';
  ctx.fillRect(b2x + 22, 225, 6, 5);
  ctx.fillStyle = '#78716c';
  ctx.fillRect(b2x + 14, 230, 3, 8);
  ctx.fillRect(b2x + 31, 230, 3, 8);

  // --- Inverted Collection Jar (倒置集气瓶) ---
  const jarX = b2x + 3, jarTopY = 118, jarH = 100;
  const waterH = Math.max(0, jarH * (1 - s.gasVolumeLeft/60));
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(jarX, jarTopY, 30, jarH);
  ctx.beginPath(); ctx.moveTo(jarX, jarTopY); ctx.lineTo(jarX+30, jarTopY); ctx.stroke();
  if (waterH > 0) {
    ctx.fillStyle = 'rgba(59,130,246,0.2)';
    ctx.fillRect(jarX+1, jarTopY+jarH-waterH, 28, waterH);
  }
  if (s.gasVolumeLeft > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(jarX+1, jarTopY, 28, jarH-waterH);
  }

  // --- O₂ Generation ---
  if (isPlaying && s.temperature > 240 && currentStep >= 3) {
    const reactants = s.particles.filter(p => p.label === 'KClO₃');
    const rate = (s.temperature - 240) * 0.00015 * speed;
    reactants.forEach(p => {
      if (Math.random() < rate) {
        p.label = 'KCl'; p.color = '#cbd5e1'; p.type = 'product';
        s.particles.push({ id: s.particles.length+1000, x: tSX, y: tSY, vx: -1.5, vy: -1.0, radius: 4, color: '#38bdf8', label: 'O₂', type: 'product' });
      }
    });
  }

  // --- O₂ Bubble Path ---
  s.particles.forEach((p, idx) => {
    if (p.label === 'O₂') {
      if (p.x > b1x && p.y > b1y) { p.x -= 0.9*speed; p.y -= 1.2*speed; }
      else if (p.x < b2x && Math.abs(p.y - b2y) < 8) { p.x += 1.5*speed; p.y = b2y + Math.sin(p.x*0.1 + s.time*2)*2; }
      else if (p.x >= b2x-5 && p.y < 252 && isTubeIn) { p.y += 1.5*speed; p.x = b2x + Math.sin(s.time*3)*2; }
      else if (p.y >= 252 && p.x > jarX-8 && p.x < jarX+38 && isTubeIn) {
        p.vy = -2.0 - Math.random()*0.6; p.vx = (Math.random()-0.5)*0.8;
        p.y += p.vy*speed; p.x += p.vx*speed;
        if (p.x < jarX+3) p.x = jarX+3;
        if (p.x > jarX+27) p.x = jarX+27;
        const surfY = jarTopY + jarH - waterH;
        if (p.y <= surfY) { s.gasVolumeLeft = Math.min(60, s.gasVolumeLeft+1.2); s.particles.splice(idx,1);
          if (currentStep===3 && s.gasVolumeLeft>=58) { setCurrentStep(4); setCustomAction(''); } }
      } else if (p.x > 450 || p.y < 40) { s.particles.splice(idx,1); }
    }
  });
  drawLabel(ctx, `试管: ${s.temperature.toFixed(0)}℃`, 8, 6, '11px var(--font-sans)', '#ef4444');
  drawLabel(ctx, `收集O₂: ${s.gasVolumeLeft.toFixed(0)}/60mL`, 8, 28, '11px var(--font-sans)', '#38bdf8');
}

// === IRON-OXYGEN: 铁丝在氧气中燃烧 ===
else if (experimentId === 'iron-oxygen') {
  // Wide-mouth gas jar
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
  ctx.strokeRect(245, 88, 150, 170);
  // Water at bottom (防高温熔融物炸裂瓶底)
  ctx.fillStyle = 'rgba(59,130,246,0.18)';
  ctx.fillRect(247, 246, 146, 10);

  // O₂ bouncing
  s.particles.forEach(p => { if (p.label==='O₂') {
    if (isPlaying) { p.x += p.vx*speed; p.y += p.vy*speed; if(p.x<250||p.x>390) p.vx*=-1; if(p.y<93||p.y>248) p.vy*=-1; }
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
  }});

  // Crucible tongs (坩埚钳) from top
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(310, 15); ctx.lineTo(322, 78);
  ctx.moveTo(334, 15); ctx.lineTo(322, 78);
  ctx.stroke();

  // Spiral iron wire (螺旋状增大接触面积)
  let wireColor = '#6b7280';
  if (currentStep >= 2 || metalPolished) wireColor = isIgnited ? '#ef4444' : '#a1a1aa';
  ctx.strokeStyle = wireColor; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const wx = 322 + Math.sin(i * 1.6) * 13;
    const wy = 85 + i * 7;
    if (i===0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
  }
  ctx.stroke();

  // Match stick at spiral bottom (末端系火柴)
  ctx.fillStyle = '#b45309'; ctx.fillRect(320, 215, 4, 22);
  ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(322, 212, 4, 0, Math.PI*2); ctx.fill();

  // Match lowering animation
  if (currentStep === 2 && ignitedMatch) {
    const mY = Math.min(90, 8 + s.time*22%120);
    ctx.fillStyle = '#b45309'; ctx.fillRect(318, mY-28, 8, 28);
    if (mY < 90) { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(322, mY, 5+Math.sin(s.time*12)*1.5, 0, Math.PI*2); ctx.fill(); }
    if (mY >= 88) { setIsIgnited(true); setCurrentStep(3); }
  }

  // Combustion: 火星四射 + Fe₃O₄黑色固体
  if (isIgnited && isPlaying && currentStep===3) {
    s.reactionProgress = Math.min(100, s.reactionProgress + 0.5*speed);
    if (Math.random() < 0.35 && s.particles.filter(p=>p.label==='O₂').length > 3) {
      for (let k=0;k<5;k++) s.particles.push({ id: s.particles.length+2000+k, x:310+Math.random()*20, y:110+Math.random()*70, vx:(Math.random()-0.5)*4, vy:3+Math.random()*4, radius:2, color:'#f97316', label:'Spark', type:'spark', opacity:1, life:30 });
      const ci = s.particles.findIndex(p=>p.label==='O₂'); if(ci!==-1) s.particles.splice(ci,1);
    }
  }
  // Sparks and Fe₃O₄
  s.particles.forEach((p, idx) => {
    if (p.type==='spark') {
      p.x+=p.vx*speed; p.y+=p.vy*speed; p.life=(p.life??0)-1;
      ctx.fillStyle=`rgba(251,146,60,${p.life/30})`; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
      if (p.y>=246 || p.life<=0) { s.particles.splice(idx,1); if(p.y>=246) s.particles.push({ id:s.particles.length+3000, x:p.x, y:245, vx:0,vy:0, radius:3, color:'#09090b', label:'Fe₃O₄', type:'product' }); }
    }
    if (p.label==='Fe₃O₄') { ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }
  });
  if (isIgnited&&Math.random()<0.2) { ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(0,0,w,h); }
  if (s.reactionProgress>=100) { setCurrentStep(4); setIsIgnited(false); }

  drawLabel(ctx, `反应: ${s.reactionProgress.toFixed(0)}%`, 10, 6, '11px var(--font-sans)', 'var(--accent)');
  drawLabel(ctx, `O₂剩余: ${s.particles.filter(p=>p.label==='O₂').length}粒子`, 10, 28, '11px var(--font-sans)', '#38bdf8');
}

// === PHOSPHORUS-OXYGEN: 红磷在氧气中燃烧 ===
else if (experimentId === 'phosphorus-oxygen') {
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
  ctx.strokeRect(245, 88, 150, 170);
  ctx.fillStyle = 'rgba(59,130,246,0.15)';
  ctx.fillRect(247, 246, 146, 10);
  // Combustion spoon
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(320, 18); ctx.lineTo(320, 152); ctx.stroke();
  ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(320, 158, 12, 0, Math.PI); ctx.fill();
  // O₂
  s.particles.forEach(p => { if(p.label==='O₂') {
    if(isPlaying){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<250||p.x>390)p.vx*=-1; if(p.y<93||p.y>248)p.vy*=-1; }
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
  }});
  // Red P
  if (currentStep>=1||reagentsAdded) { s.particles.forEach(p => { if(p.label==='P') {
    ctx.fillStyle=isIgnited?'#f87171':p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
  }});}
  // Combustion
  if (isIgnited&&isPlaying) {
    if (currentStep===1) { ctx.fillStyle='rgba(239,68,68,0.4)'; ctx.beginPath(); ctx.arc(320,152,15+Math.sin(s.time*10)*3,0,Math.PI*2); ctx.fill(); }
    else if (currentStep===2&&customAction==='insert-bottle') {
      s.reactionProgress=Math.min(100,s.reactionProgress+0.5*speed);
      ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(320,152,45+Math.random()*15,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(253,224,71,0.4)'; ctx.beginPath(); ctx.arc(320,152,60+Math.random()*20,0,Math.PI*2); ctx.fill();
      if(Math.random()<0.4&&s.particles.filter(p=>p.label==='P').length>0&&s.particles.filter(p=>p.label==='O₂').length>0){
        const pi=s.particles.findIndex(p=>p.label==='P'); if(pi!==-1)s.particles.splice(pi,1);
        const oi=s.particles.findIndex(p=>p.label==='O₂'); if(oi!==-1)s.particles.splice(oi,1);
        for(let k=0;k<8;k++) s.particles.push({ id:s.particles.length+4000+k, x:320+(Math.random()-0.5)*20, y:142-Math.random()*10, vx:(Math.random()-0.5)*1.5, vy:-0.5-Math.random()*0.8, radius:4+Math.random()*4, color:'rgba(255,255,255,0.7)', label:'P₂O₅', type:'smoke', opacity:0.8, life:60+Math.random()*30 });
      }
      if(s.reactionProgress>=100){ setCurrentStep(3); setIsIgnited(false); setCustomAction(''); }
    }
  }
  // P₂O₅白烟
  s.particles.forEach((p,idx)=>{ if(p.type==='smoke'){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<252||p.x>388)p.vx*=-1; if(p.y<93||p.y>248)p.vy*=-1; ctx.fillStyle=`rgba(241,245,249,${p.opacity??0.6})`; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
  drawLabel(ctx, `反应: ${s.reactionProgress.toFixed(0)}%`, 10, 6, '11px var(--font-sans)', 'var(--accent)');
  drawLabel(ctx, `P₂O₅白烟: ${s.particles.filter(p=>p.type==='smoke').length}粒子`, 10, 28, '11px var(--font-sans)', '#ffffff');
}

// === SULFUR-OXYGEN: 硫在氧气中燃烧 ===
else if (experimentId === 'sulfur-oxygen') {
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
  ctx.strokeRect(245, 88, 150, 170);
  ctx.fillStyle = 'rgba(59,130,246,0.2)';
  ctx.fillRect(247, 246, 146, 10);
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(320, 18); ctx.lineTo(320, 152); ctx.stroke();
  ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(320, 158, 12, 0, Math.PI); ctx.fill();
  s.particles.forEach(p => { if(p.label==='O₂') {
    if(isPlaying){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<250||p.x>390)p.vx*=-1; if(p.y<93||p.y>248)p.vy*=-1; }
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
  }});
  if (currentStep>=1||reagentsAdded) { s.particles.forEach(p => { if(p.label==='S') {
    ctx.fillStyle=isIgnited?'#fef08a':p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
  }});}
  if (isIgnited&&isPlaying) {
    if (currentStep===1) { ctx.fillStyle='rgba(59,130,246,0.4)'; ctx.beginPath(); ctx.arc(320,152,12+Math.sin(s.time*8)*2,0,Math.PI*2); ctx.fill(); }
    else if (currentStep===2&&customAction==='insert-bottle') {
      s.reactionProgress=Math.min(100,s.reactionProgress+0.45*speed);
      ctx.fillStyle='rgba(139,92,246,0.5)'; ctx.beginPath(); ctx.arc(320,152,32+Math.random()*12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(59,130,246,0.3)'; ctx.beginPath(); ctx.arc(320,152,48+Math.random()*15,0,Math.PI*2); ctx.fill();
      if(Math.random()<0.35&&s.particles.filter(p=>p.label==='S').length>0&&s.particles.filter(p=>p.label==='O₂').length>0){
        const si=s.particles.findIndex(p=>p.label==='S'); if(si!==-1)s.particles.splice(si,1);
        const oi=s.particles.findIndex(p=>p.label==='O₂'); if(oi!==-1)s.particles.splice(oi,1);
        s.particles.push({ id:s.particles.length+5000, x:320, y:142, vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2, radius:5, color:'rgba(192,132,252,0.4)', label:'SO₂', type:'product' });
      }
      if(s.reactionProgress>=100){ setCurrentStep(3); setIsIgnited(false); setCustomAction(''); }
    }
  }
  s.particles.forEach(p=>{ if(p.label==='SO₂'){ if(isPlaying){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<250||p.x>390)p.vx*=-1; if(p.y<93||p.y>248)p.vy*=-1; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='8px sans-serif'; ctx.fillText('SO₂',p.x-6,p.y+3); }});
  drawLabel(ctx, `反应: ${s.reactionProgress.toFixed(0)}%`, 10, 6, '11px var(--font-sans)', 'var(--accent)');
  drawLabel(ctx, `SO₂: ${s.particles.filter(p=>p.label==='SO₂').length}粒子`, 10, 28, '11px var(--font-sans)', '#c084fc');
}

// === CO2-NAOH: CO₂与NaOH溶液反应 ===
else if (experimentId === 'co2-naoh') {
  // Round-bottom flask
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(295, 38); ctx.lineTo(295, 95);
  ctx.arc(320, 168, 78, -2.15, -0.99);
  ctx.lineTo(345, 95); ctx.lineTo(345, 38);
  ctx.stroke();
  // Rubber stopper
  ctx.fillStyle = '#78716c'; ctx.fillRect(316, 34, 8, 8);
  // Syringe on top
  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(314, 8, 5, 28);
  ctx.strokeStyle = '#94a3b8'; ctx.strokeRect(314, 8, 5, 28);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(315, 2, 3, 6);
  // NaOH solution at bottom
  ctx.fillStyle = 'rgba(244,114,182,0.15)';
  ctx.beginPath(); ctx.arc(320, 168, 72, 0.5, 2.64); ctx.fill();
  // Balloon in neck
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath(); ctx.arc(320, 88, s.balloonSize, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(320, 40); ctx.lineTo(320, 88-s.balloonSize); ctx.stroke();
  // CO₂ particles
  s.particles.forEach(p => { if(p.label==='CO₂'){
    if(isPlaying){ p.x+=p.vx*speed; p.y+=p.vy*speed;
      const dx=p.x-320, dy=p.y-168, dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>68){ const nx=dx/dist, ny=dy/dist, dot=p.vx*nx+p.vy*ny; p.vx=(p.vx-2*dot*nx); p.vy=(p.vy-2*dot*ny); p.x=320+nx*67; p.y=168+ny*67; }
      const bdx=p.x-320, bdy=p.y-88, bdist=Math.sqrt(bdx*bdx+bdy*bdy);
      if(bdist<s.balloonSize+5){ const bnx=bdx/bdist, bny=bdy/bdist, bdot=p.vx*bnx+p.vy*bny; p.vx=(p.vx-2*bdot*bnx); p.vy=(p.vy-2*bdot*bny); p.x=320+bnx*(s.balloonSize+6); p.y=88+bny*(s.balloonSize+6); }
    }
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
  }});
  // Ions
  s.particles.forEach(p => { if(p.type==='solvent'||p.label==='CO₃²⁻'){
    if(isPlaying){ p.x+=p.vx*0.4*speed; p.y+=p.vy*0.4*speed;
      const dx=p.x-320, dy=p.y-168, dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>70){ const nx=dx/dist, ny=dy/dist, dot=p.vx*nx+p.vy*ny; p.vx=(p.vx-2*dot*nx); p.vy=(p.vy-2*dot*ny); p.x=320+nx*69; p.y=168+ny*69; }
      if(p.y<205){p.y=205;p.vy*=-1;}
    }
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
  }});
  // Inject NaOH
  if (customAction==='inject-naoh'&&isPlaying) {
    ctx.fillStyle='#f472b6'; ctx.beginPath(); ctx.arc(320,58+s.time*10%150,4,0,Math.PI*2); ctx.fill();
    const co2s=s.particles.filter(p=>p.label==='CO₂'), ohs=s.particles.filter(p=>p.label==='OH⁻');
    if(co2s.length>0&&ohs.length>0&&Math.random()<0.15){
      const ci=s.particles.findIndex(p=>p.label==='CO₂'); if(ci!==-1)s.particles.splice(ci,1);
      const oi=s.particles.findIndex(p=>p.label==='OH⁻'); if(oi!==-1){ s.particles[oi].label='CO₃²⁻'; s.particles[oi].color='#22c55e'; }
      s.pressure=Math.max(0.1,s.pressure-0.03); s.balloonSize=Math.min(35,s.balloonSize+0.8);
    }
    if(currentStep===2&&s.balloonSize>=34){ setCurrentStep(3); setCustomAction(''); }
  }
  drawLabel(ctx, `压强: ${s.pressure.toFixed(2)}atm`, 10, 6, '11px var(--font-sans)', '#f43f5e');
  drawLabel(ctx, `CO₂: ${s.particles.filter(p=>p.label==='CO₂').length}粒子`, 10, 28, '11px var(--font-sans)', '#94a3b8');
}

// === ELECTROLYSIS-WATER: 电解水实验 (霍夫曼电解器) ===
else if (experimentId === 'electrolysis-water') {
  // Stand
  ctx.fillStyle = '#1e293b'; ctx.fillRect(148, 268, 24, 5);
  ctx.fillStyle = '#334155'; ctx.fillRect(158, 100, 4, 168);
  // Left tube (cathode - H₂)
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
  ctx.strokeRect(135, 45, 34, 175);
  ctx.fillStyle = '#475569'; ctx.fillRect(150, 40, 4, 5);
  // Right tube (anode - O₂)
  ctx.strokeRect(231, 45, 34, 175);
  ctx.fillStyle = '#475569'; ctx.fillRect(246, 40, 4, 5);
  // Reservoir bulb
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(200, 218, 22, 0, Math.PI*2); ctx.stroke();
  // Bridge
  ctx.strokeRect(169, 213, 62, 8);
  // Electrodes
  ctx.fillStyle = '#1e293b'; ctx.fillRect(162, 228, 4, 24);
  ctx.fillStyle = '#1e293b'; ctx.fillRect(234, 228, 4, 24);
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px var(--font-sans)'; ctx.fillText('-', 130, 245);
  ctx.fillStyle = '#3b82f6'; ctx.fillText('+', 258, 245);
  // Gas volumes
  const lGasH = Math.min(160, s.gasVolumeLeft*3.6);
  const rGasH = Math.min(160, s.gasVolumeRight*7.2);
  ctx.fillStyle = 'rgba(59,130,246,0.18)';
  ctx.fillRect(136, 46+lGasH, 32, 173-lGasH);
  ctx.fillRect(232, 46+rGasH, 32, 173-rGasH);
  ctx.fillRect(169, 213, 62, 7);
  // Generate bubbles
  const isPowerOn = currentStep>=1 && (customAction==='turn-on-power'||parameters.voltage>0);
  if (isPlaying&&isPowerOn) {
    const v = parameters.voltage>0?parameters.voltage:9;
    const rate = v*0.005*speed;
    if(Math.random()<rate) s.particles.push({ id:s.particles.length+6000, x:145+Math.random()*14, y:220, vx:(Math.random()-0.5)*0.5, vy:-1.5-Math.random()*0.5, radius:3.5, color:'#10b981', label:'H₂', type:'product' });
    if(Math.random()<rate*0.5) s.particles.push({ id:s.particles.length+7000, x:238+Math.random()*14, y:220, vx:(Math.random()-0.5)*0.5, vy:-1.2-Math.random()*0.5, radius:4.5, color:'#38bdf8', label:'O₂', type:'product' });
  }
  s.particles.forEach((p,idx)=>{
    if(p.type==='solvent'||p.label==='H⁺'){ if(isPlaying){ p.x+=p.vx*0.5*speed; p.y+=p.vy*0.5*speed; if(p.x<200){ if(p.x<140)p.x=140; if(p.x>165)p.x=165; if(p.y<46+lGasH)p.y=46+lGasH; if(p.y>232)p.y=232; } else { if(p.x<235)p.x=235; if(p.x>260)p.x=260; if(p.y<46+rGasH)p.y=46+rGasH; if(p.y>232)p.y=232; } p.vx*=-1; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }
    if(p.type==='product'){ p.x+=p.vx*speed; p.y+=p.vy*speed; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
      if(p.label==='H₂'&&p.y<=46+lGasH){ s.gasVolumeLeft=Math.min(45,s.gasVolumeLeft+0.15); s.particles.splice(idx,1); if(currentStep===1&&s.gasVolumeLeft>=40){ setCurrentStep(2); setCustomAction(''); } }
      if(p.label==='O₂'&&p.y<=46+rGasH){ s.gasVolumeRight=Math.min(22.5,s.gasVolumeRight+0.15); s.particles.splice(idx,1); } }
  });
  drawLabel(ctx, `H₂(阴极): ${s.gasVolumeLeft.toFixed(1)}mL`, 10, 6, '11px var(--font-sans)', '#10b981');
  drawLabel(ctx, `O₂(阳极): ${s.gasVolumeRight.toFixed(1)}mL`, 10, 28, '11px var(--font-sans)', '#38bdf8');
}

// === SALT-PURIFICATION: 粗盐提纯 ===
else if (experimentId === 'salt-purification') {
  if (currentStage==='dissolve') {
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3.5;
    ctx.strokeRect(200, 135, 160, 105);
    ctx.fillStyle='rgba(59,130,246,0.12)'; ctx.fillRect(202, 160, 156, 78);
    // Glass rod stirring
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(280+(stirring?Math.sin(s.time*5)*18:0), 90);
    ctx.lineTo(280+(stirring?Math.sin(s.time*5)*9:0), 215);
    ctx.stroke();
    // Particles
    s.particles.forEach((p,idx)=>{
      if(isPlaying){ if(stirring){ const dx=p.x-280, dy=p.y-195, dist=Math.sqrt(dx*dx+dy*dy), angle=Math.atan2(dy,dx)+0.1*speed; p.x=280+Math.cos(angle)*dist; p.y=195+Math.sin(angle)*dist; } else { p.x+=p.vx*speed; p.y+=p.vy*speed; }
        if(p.x<205)p.x=205; if(p.x>355)p.x=355; if(p.y<162)p.y=162; if(p.y>235)p.y=235;
        if(p.label==='NaCl'&&Math.random()<(stirring?0.05:0.01)*speed){ p.label='Na⁺'; p.color='#c084fc'; p.radius=3.5; s.particles.push({ id:s.particles.length+8000, x:p.x+(Math.random()-0.5)*10, y:p.y+(Math.random()-0.5)*10, vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*1.5, radius:3.5, color:'#22c55e', label:'Cl⁻', type:'product' }); } }
      ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
    });
    const dissolvedIons=s.particles.filter(p=>p.label==='Na⁺'||p.label==='Cl⁻').length;
    if(currentStep===0&&reagentsAdded&&dissolvedIons>=38){ setStirring(false); setCurrentStep(1); setCurrentStage('filter'); }
    drawLabel(ctx, '步骤1:溶解 — 搅拌加速溶解', 10, 6, '11px var(--font-sans)', '#ffffff');
    drawLabel(ctx, `溶解: ${((dissolvedIons/40)*100).toFixed(0)}%`, 10, 28, '11px var(--font-sans)', '#10b981');
  }
  else if (currentStage==='filter') {
    // Iron stand + ring
    ctx.fillStyle='#1e293b'; ctx.fillRect(58, 268, 24, 5);
    ctx.fillStyle='#334155'; ctx.fillRect(68, 85, 4, 183);
    ctx.strokeStyle='#475569'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(190, 135, 35, 0, Math.PI*2); ctx.stroke();
    // Funnel
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(138, 100); ctx.lineTo(242, 100); ctx.lineTo(192, 160); ctx.lineTo(190, 178); ctx.lineTo(194, 178); ctx.lineTo(192, 160); ctx.stroke();
    // Filter paper
    ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(144, 103); ctx.lineTo(192, 152); ctx.lineTo(240, 103); ctx.stroke();
    // Sand trapped
    s.particles.forEach(p=>{ if(p.label==='泥沙'){ p.x=180+Math.random()*25; p.y=108+Math.random()*18; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
    // Glass rod (引流)
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(170, 80); ctx.lineTo(194, 155); ctx.stroke();
    // Receiving beaker
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3;
    ctx.strokeRect(140, 195, 100, 68);
    ctx.fillStyle='rgba(59,130,246,0.1)'; ctx.fillRect(142, 230, 96, 31);
    // Upper beaker
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2.5;
    ctx.strokeRect(260, 55, 55, 50);
    ctx.fillStyle='rgba(161,161,170,0.2)'; ctx.fillRect(262, 75, 51, 25);
    const isFiltering=customAction==='start-filtration';
    if(isPlaying&&isFiltering&&Math.random()<0.2){ ctx.fillStyle='rgba(59,130,246,0.4)'; ctx.beginPath(); ctx.arc(192,178+s.time*10%18,3,0,Math.PI*2); ctx.fill(); }
    s.particles.forEach(p=>{ if(p.label==='Na⁺'||p.label==='Cl⁻'){ if(p.y<195&&isFiltering){ p.x=145+Math.random()*90; p.y=235+Math.random()*20; } if(p.y>=195&&isPlaying){ p.x+=p.vx*0.4*speed; p.y+=p.vy*0.4*speed; if(p.x<145)p.x=145; if(p.x>235)p.x=235; if(p.y<230)p.y=230; if(p.y>259)p.y=259; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
    if(isPlaying&&isFiltering){ s.reactionProgress=Math.min(100,s.reactionProgress+0.6*speed); if(s.reactionProgress>=100){ setCurrentStep(2); setCurrentStage('evaporate'); s.reactionProgress=0; setCustomAction(''); }}
    drawLabel(ctx, '步骤2:过滤 — 一贴二低三靠', 10, 6, '11px var(--font-sans)', '#ffffff');
    drawLabel(ctx, isFiltering?`过滤中: ${s.reactionProgress.toFixed(0)}%`:'点击开始引流', 10, 28, '11px var(--font-sans)', 'var(--success)');
  }
  else {
    // Evaporating dish
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.arc(280, 158, 58, 0, Math.PI); ctx.stroke();
    ctx.fillStyle='#334155'; ctx.fillRect(265, 218, 30, 18);
    ctx.fillStyle='#64748b'; ctx.fillRect(277, 200, 6, 18);
    if(isHeating&&isPlaying){ ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.moveTo(270,200); ctx.quadraticCurveTo(280,175+Math.random()*10,290,200); ctx.fill(); if(Math.random()<0.2){ ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(250+Math.random()*60,140-s.time*8%80,4+Math.random()*4,0,Math.PI*2); ctx.fill(); } }
    s.particles.forEach((p,idx)=>{ if(p.label==='Na⁺'||p.label==='Cl⁻'){ if(s.reactionProgress>80){ const gi=idx%20; p.x=250+(gi%5)*15; p.y=183+Math.floor(gi/5)*10; p.vx=0;p.vy=0; } else { p.x+=p.vx*0.5*speed; p.y+=p.vy*0.5*speed; const dx=p.x-280, dy=p.y-158, dist=Math.sqrt(dx*dx+dy*dy); if(dist>54){ const nx=dx/dist, ny=dy/dist, dot=p.vx*nx+p.vy*ny; p.vx=(p.vx-2*dot*nx); p.vy=(p.vy-2*dot*ny); p.x=280+nx*53; p.y=158+ny*53; } if(p.y<160)p.y=160; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
    if(currentStep===2&&s.reactionProgress>=100){ setIsHeating(false); setStirring(false); setCurrentStep(3); }
    drawLabel(ctx, '步骤3:蒸发结晶', 10, 6, '11px var(--font-sans)', '#ffffff');
    drawLabel(ctx, `结晶: ${s.reactionProgress.toFixed(0)}%`, 10, 28, '11px var(--font-sans)', '#ef4444');
  }
}

// === OXYGEN-LAB: 氧气制取与性质验证 ===
else if (experimentId === 'oxygen-lab') {
  if (currentStep < 4) {
    // Same setup as kclo3-oxygen
    ctx.fillStyle = '#1e293b'; ctx.fillRect(48, 270, 28, 5);
    ctx.fillStyle = '#334155'; ctx.fillRect(60, 70, 4, 200);
    const tMX=140, tMY=130, tBX=215, tBY=120;
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(tMX,tMY-13); ctx.lineTo(tBX,tBY-13); ctx.arc(tBX,tBY,13,-Math.PI/2,Math.PI/2); ctx.lineTo(tMX,tMY+13); ctx.stroke();
    ctx.fillStyle='#78716c'; ctx.fillRect(tMX-2,tMY-14,7,28);
    ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(tBX-5,tBY-2,11,0,Math.PI); ctx.fill();
    ctx.fillStyle='#475569'; ctx.fillRect(tBX-22,178,24,14);
    ctx.fillStyle='#1c1917'; ctx.fillRect(tBX-13,170,2,8);
    if(isHeating&&isPlaying){ s.temperature=Math.min(450,s.temperature+2*speed); ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.moveTo(tBX-18,170); ctx.quadraticCurveTo(tBX-10,135+Math.random()*10,tBX-2,170); ctx.fill(); }
    ctx.strokeStyle='#bae6fd'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(tMX-3,tMY); ctx.lineTo(tMX-25,tMY-22); ctx.lineTo(280,tMY-22);
    if(!tubeRemoved) ctx.lineTo(280,250); else ctx.lineTo(270,170);
    ctx.stroke();
    ctx.fillStyle='rgba(59,130,246,0.1)'; ctx.fillRect(255,210,120,45);
    ctx.strokeStyle='#64748b'; ctx.lineWidth=2.5; ctx.strokeRect(255,210,120,45);
    const jX=298, jTY=118, jH=98;
    const cpct=s.gasVolumeLeft/50, wh=jH*(1-cpct);
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3; ctx.strokeRect(jX,jTY,26,jH);
    if(wh>0){ ctx.fillStyle='rgba(59,130,246,0.2)'; ctx.fillRect(jX+1,jTY+jH-wh,24,wh); }
    if(isPlaying&&s.temperature>240&&currentStep===1){
      s.particles.filter(p=>p.label==='KClO₃').forEach(p=>{ if(Math.random()<0.05*speed){
        const ri=s.particles.findIndex(q=>q.label==='KClO₃'); if(ri!==-1){ s.particles[ri].label='KCl'; s.particles[ri].color='#cbd5e1'; }
        s.particles.push({ id:s.particles.length+9000, x:tMX-3, y:tMY, vx:-1.5, vy:-1.0, radius:4, color:'#38bdf8', label:'O₂', type:'product' });
      }});
    }
    s.particles.forEach((p,idx)=>{ if(p.label==='O₂'){
      if(p.x>tMX-25&&p.y>tMY-22){ p.x-=0.9*speed; p.y-=1.2*speed; } else if(p.x<280&&Math.abs(p.y-(tMY-22))<8){ p.x+=1.5*speed; } else if(p.x>=275&&p.y<248&&!tubeRemoved){ p.y+=1.5*speed; }
      else if(p.y>=248&&p.x>jX-5&&p.x<jX+30&&!tubeRemoved){ p.vy=-2-Math.random()*0.6; p.y+=p.vy*speed; p.x+=p.vx*speed; if(p.x<jX+3)p.x=jX+3; if(p.x>jX+23)p.x=jX+23; if(p.y<=jTY+jH-wh){ s.gasVolumeLeft=Math.min(50,s.gasVolumeLeft+2.5); s.particles.splice(idx,1); if(currentStep===1&&s.gasVolumeLeft>=48){ setCurrentStep(2); setCustomAction(''); } } }
      else if(!tubeRemoved&&p.y>=218){ p.vy=-1.5; if(p.y<=220)s.particles.splice(idx,1); }
      ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
    }});
    drawLabel(ctx, '阶段1:制取O₂', 8, 6, '11px var(--font-sans)', '#ffffff');
    drawLabel(ctx, `O₂: ${(s.gasVolumeLeft*2).toFixed(0)}%`, 8, 28, '11px var(--font-sans)', '#38bdf8');
  } else {
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3.5; ctx.strokeRect(240,100,160,180);
    ctx.fillStyle='#6b7280'; ctx.fillRect(242,268,156,10);
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(320,18); ctx.lineTo(320,162); ctx.stroke();
    ctx.fillStyle='#475569'; ctx.beginPath(); ctx.arc(320,168,12,0,Math.PI); ctx.fill();
    s.particles.forEach(p=>{ if(p.label==='O₂'){ if(isPlaying){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<245||p.x>395)p.vx*=-1; if(p.y<105||p.y>275)p.vy*=-1; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
    if(isIgnited&&isPlaying){
      if(selectedFuel==='Fe'){ if(Math.random()<0.4&&s.particles.filter(p=>p.label==='O₂').length>0){ for(let k=0;k<6;k++) s.particles.push({ id:s.particles.length+10000+k, x:320,y:165, vx:(Math.random()-0.5)*4, vy:2+Math.random()*4, radius:2, color:'#f97316', label:'Fe3O4_spark', type:'spark', life:20 }); s.particles.splice(0,1); }
        s.particles.forEach((p,idx)=>{ if(p.type==='spark'){ p.x+=p.vx*speed; p.y+=p.vy*speed; p.life=(p.life??0)-1; ctx.fillStyle='rgba(249,115,22,0.8)'; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill(); if(p.y>=268||p.life<=0)s.particles.splice(idx,1); }});
        if(Math.random()<0.2){ ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(0,0,w,h); } }
      else if(selectedFuel==='P'){ ctx.fillStyle='rgba(253,224,71,0.4)'; ctx.beginPath(); ctx.arc(320,160,20+Math.random()*15,0,Math.PI*2); ctx.fill();
        if(Math.random()<0.3&&s.particles.filter(p=>p.label==='O₂').length>0){ s.particles.push({ id:s.particles.length+11000, x:320+(Math.random()-0.5)*15, y:155-Math.random()*5, vx:(Math.random()-0.5)*1.5, vy:-0.6-Math.random()*0.6, radius:5+Math.random()*4, color:'rgba(255,255,255,0.7)', label:'smoke_p', type:'smoke', opacity:0.8 }); s.particles.splice(0,1); } }
      else if(selectedFuel==='S'){ ctx.fillStyle='rgba(59,130,246,0.4)'; ctx.beginPath(); ctx.arc(320,160,20+Math.random()*10,0,Math.PI*2); ctx.fill();
        if(Math.random()<0.3&&s.particles.filter(p=>p.label==='O₂').length>0){ s.particles.push({ id:s.particles.length+12000, x:320,y:160, vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2, radius:5, color:'rgba(192,132,252,0.4)', label:'SO₂', type:'product' }); s.particles.splice(0,1); } }
    }
    s.particles.forEach(p=>{ if(p.label==='smoke_p'||p.label==='SO₂'){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<245||p.x>395)p.vx*=-1; if(p.y<105||p.y>275)p.vy*=-1; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
    drawLabel(ctx, '阶段2:性质验证', 10, 6, '11px var(--font-sans)', '#ffffff');
    drawLabel(ctx, `燃料:${selectedFuel} | O₂:${s.particles.filter(p=>p.label==='O₂').length}粒子`, 10, 28, '11px var(--font-sans)', '#38bdf8');
  }
}

// === CO2-LAB: 二氧化碳制取与性质 ===
else if (experimentId === 'co2-lab') {
  const flaskX=120, flaskTopY=130, flaskBotY=215;
  // Conical flask
  ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(flaskX-7,flaskTopY); ctx.lineTo(flaskX-34,flaskBotY); ctx.lineTo(flaskX+34,flaskBotY); ctx.lineTo(flaskX+7,flaskTopY); ctx.stroke();
  ctx.strokeRect(flaskX-7,flaskTopY-18,14,18);
  ctx.beginPath(); ctx.moveTo(flaskX-34,flaskBotY); ctx.lineTo(flaskX+34,flaskBotY); ctx.stroke();
  // Marble chips
  if(currentStep>=1||reagentsAdded){ ctx.fillStyle='#a1a1aa'; ctx.beginPath(); ctx.arc(flaskX-8,flaskBotY-10,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#9ca3af'; ctx.beginPath(); ctx.arc(flaskX+10,flaskBotY-8,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#a8a29e'; ctx.beginPath(); ctx.arc(flaskX,flaskBotY-16,9,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(flaskX-30,flaskBotY-28,60,20); }
  // Rubber stopper + thistle funnel (下端伸入液面以下)
  ctx.fillStyle='#78716c'; ctx.fillRect(flaskX-8,flaskTopY-20,16,6);
  ctx.strokeStyle='#bae6fd'; ctx.lineWidth=1.8;
  ctx.beginPath(); ctx.moveTo(flaskX+5,flaskTopY-20); ctx.lineTo(flaskX+5,flaskTopY-52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(flaskX-6,flaskTopY-52); ctx.lineTo(flaskX+18,flaskTopY-52); ctx.stroke();
  // Delivery tube (瓶内刚露出胶塞, 集气瓶端伸至底部)
  const dY = flaskTopY-78;
  ctx.strokeStyle='#bae6fd'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(flaskX,flaskTopY-20);
  if(customAction==='litmus-test'){ const dLX=300; ctx.lineTo(flaskX,dY); ctx.lineTo(dLX,dY); ctx.lineTo(dLX,192); ctx.stroke();
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3; ctx.strokeRect(282,140,36,120); ctx.fillStyle=s.litmusTestTubeColor; ctx.fillRect(283,175,34,83); ctx.fillStyle='#94a3b8'; ctx.font='9px var(--font-sans)'; ctx.fillText('石蕊',285,168);
    // Also show lime water tube
    ctx.strokeRect(340,140,36,120); ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(341,175,34,83); ctx.fillText('石灰水',343,168);
  } else { const dCX=285; ctx.lineTo(flaskX,dY); ctx.lineTo(dCX,dY); ctx.lineTo(dCX,210); ctx.stroke();
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3.5; ctx.strokeRect(260,118,70,138);
    const fillH=134*(s.co2Poured/100); ctx.fillStyle='rgba(148,163,184,0.12)'; ctx.fillRect(261,256-fillH,68,fillH);
    ctx.fillStyle='#fef3c7'; ctx.fillRect(285,228,8,28); if(s.candleHeightLow>0){ ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(289,224+Math.random()*2,5,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle='#fef3c7'; ctx.fillRect(315,178,8,78); if(s.candleHeightHigh>0){ ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(319,174+Math.random()*2,5,0,Math.PI*2); ctx.fill(); }
  }
  // CO₂ generation
  if(isPlaying&&(currentStep>=1||reagentsAdded)){ if(s.particles.filter(p=>p.label==='CaCO₃').length>0&&Math.random()<0.12*speed) s.particles.push({ id:s.particles.length+13000, x:flaskX-4+Math.random()*14, y:flaskBotY-22, vx:(Math.random()-0.5)*0.5, vy:-2, radius:4, color:'#94a3b8', label:'CO₂', type:'product' }); if(currentStep===1&&s.time%5>2.5){ setCurrentStep(2); setCustomAction('candle-test'); } }
  s.particles.forEach((p,idx)=>{ if(p.label==='CO₂'){ p.y+=p.vy*speed; p.x+=p.vx*speed; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
    if(p.y<=dY&&p.x<140){p.vy=0;p.vx=2;} else if(p.x>=285&&p.y<=dY+5&&customAction==='candle-test'){p.vx=0;p.vy=2;}
    else if(p.x>=300&&p.y<=dY+5&&customAction==='litmus-test'){p.vx=0;p.vy=2;}
    else if(p.y>=200&&p.x>=260&&p.x<=290&&customAction==='candle-test'){p.vx=(Math.random()-0.5)*1;p.vy=(Math.random()-0.5)*1;}
    else if(p.y>=180&&p.x>=287&&p.x<=315&&customAction==='litmus-test'){p.vx=(Math.random()-0.5)*0.8;p.vy=(Math.random()-0.5)*0.8; if(Math.random()<0.15){ s.ph=Math.max(4,s.ph-0.1); s.litmusTestTubeColor=`rgba(239,68,68,${0.3+(7-s.ph)*0.05})`; s.particles.splice(idx,1); if(currentStep===3&&s.ph<=4.1){ setCurrentStep(4); setCustomAction(''); }}}
    if(p.y>=256-134*(s.co2Poured/100)&&customAction==='candle-test'){ s.co2Poured=Math.min(100,s.co2Poured+0.8); s.particles.splice(idx,1); } }});
  if(customAction==='candle-test'){ const co2Y=256-134*(s.co2Poured/100); if(co2Y<=224)s.candleHeightLow=0; if(co2Y<=174)s.candleHeightHigh=0; if(currentStep===2&&s.candleHeightLow===0&&s.candleHeightHigh===0){ setCurrentStep(3); setCustomAction('litmus-test'); }}
  drawLabel(ctx, 'CaCO₃+2HCl→CaCl₂+H₂O+CO₂↑', 6, 6, '10px var(--font-sans)', '#ffffff');
  if(customAction==='litmus-test'){ drawLabel(ctx, `石蕊pH:${s.ph.toFixed(1)}→${s.ph<6?'红':'紫'}`, 6, 26, '10px var(--font-sans)', '#f87171'); }
  else { drawLabel(ctx, `矮:${s.candleHeightLow>0?'燃':'灭'} 高:${s.candleHeightHigh>0?'燃':'灭'}`, 6, 26, '10px var(--font-sans)', '#fbbf24'); }
}

// === METAL-REACTIONS: 金属活动性 ===
else if (experimentId === 'metal-reactions') {
  const ctrs=[130,260,390,520], metals=['Mg','Zn','Fe','Cu'], pcl=['#e2e8f0','#cbd5e1','#a1a1aa','#ea580c'], ocl=['#4b5563','#374151','#451a03','#78350f'];
  ctrs.forEach((c,i)=>{ ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(c-14,100); ctx.lineTo(c-14,228); ctx.arc(c,228,14,Math.PI,0,true); ctx.lineTo(c+14,100); ctx.stroke();
    if(reagentsAdded){ ctx.fillStyle='rgba(239,68,68,0.1)'; ctx.beginPath(); ctx.moveTo(c-13,140); ctx.lineTo(c-13,228); ctx.arc(c,228,13,Math.PI,0,true); ctx.lineTo(c+13,140); ctx.fill(); }
    const isDrop=customAction==='drop-metals', cl=metalPolished?pcl[i]:ocl[i]; ctx.fillStyle=cl;
    if(isDrop) ctx.fillRect(c-4,175,8,58); else ctx.fillRect(c-4,48,8,38);
    ctx.fillStyle='var(--text-primary)'; ctx.font='bold 11px var(--font-sans)'; ctx.textAlign='center'; ctx.fillText(metals[i],c,isDrop?92:38);
  });
  if(reagentsAdded) s.particles.forEach(p=>{ if(p.label==='H⁺'){ if(isPlaying){ p.x+=p.vx*0.4*speed; p.y+=p.vy*0.4*speed; const ti=Math.floor((p.x-80)/130), cc=ctrs[ti]||130; if(p.x<cc-11)p.x=cc-11; if(p.x>cc+11)p.x=cc+11; if(p.y<142)p.y=142; if(p.y>236)p.y=236; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
  if(customAction==='drop-metals'&&isPlaying){ const rt=[0.15,0.05,0.015,0]; ctrs.forEach((c,i)=>{ if(Math.random()<rt[i]*speed) s.particles.push({ id:s.particles.length+14000+i*1000, x:c-10+Math.random()*20, y:220-Math.random()*20, vx:(Math.random()-0.5)*0.5, vy:-1.5-Math.random()*0.5, radius:3, color:'#10b981', label:'H₂', type:'product' }); }); }
  s.particles.forEach((p,idx)=>{ if(p.label==='H₂'){ p.y+=p.vy*speed; p.x+=p.vx*speed; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); if(p.y<=140)s.particles.splice(idx,1); }});
  drawLabel(ctx, '速率: Mg>Zn>Fe>Cu', 8, 6, '11px var(--font-sans)', '#ffffff');
  drawLabel(ctx, 'M+2HCl→MCl₂+H₂↑', 8, 28, '11px var(--font-sans)', '#10b981');
}

// === COMBUSTION-CONDITIONS: 燃烧条件实验 ===
else if (experimentId === 'combustion-conditions') {
  ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3.5; ctx.strokeRect(120,138,160,100);
  if(apparatusAssembled){ ctx.fillStyle='rgba(59,130,246,0.15)'; ctx.fillRect(122,168,156,68); ctx.fillStyle='#b45309'; ctx.fillRect(100,133,200,5);
    s.particles.forEach(p=>{ if(p.type==='reactant'){ ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.font='bold 7px var(--font-sans)'; ctx.fillText(p.label==='白磷'?'WP':'RP',p.x-5,p.y+3); } if(p.label==='O₂'){ if(isPlaying){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<80||p.x>330)p.vx*=-1; if(p.y<30||p.y>130)p.vy*=-1; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
    if(isPlaying){ const wpi=s.particles.findIndex(p=>p.label==='白磷'&&p.y<138); if(wpi!==-1)s.particles[wpi].label='combusting'; if(customAction==='bubble-oxygen'&&Math.random()<0.2) s.particles.push({ id:s.particles.length+15000, x:200+(Math.random()-0.5)*6, y:240, vx:0, vy:-1.2, radius:4, color:'#38bdf8', label:'bubbled_O2', type:'product' }); }
    const cp=s.particles.find(p=>p.label==='combusting'); if(cp){ ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.moveTo(155,133); ctx.quadraticCurveTo(165,95+Math.random()*10,175,133); ctx.fill(); if(Math.random()<0.3) s.particles.push({ id:s.particles.length+16000, x:165+(Math.random()-0.5)*8, y:118, vx:(Math.random()-0.5)*1, vy:-1.5, radius:4+Math.random()*3, color:'rgba(255,255,255,0.4)', label:'P2O5_smoke', type:'smoke' }); }
    s.particles.forEach((p,idx)=>{ if(p.label==='bubbled_O2'){ p.y+=p.vy*speed; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); const dx=p.x-200, dy=p.y-225; if(Math.sqrt(dx*dx+dy*dy)<12){ s.particles.splice(idx,1); const wwi=s.particles.findIndex(q=>q.label==='白磷'&&q.y>138); if(wwi!==-1)s.particles[wwi].label='combusting_underwater'; } else if(p.y<=170){ p.label='O₂'; p.vx=(Math.random()-0.5)*1.5; } }
      if(p.label==='P2O5_smoke'){ p.y+=p.vy*speed; p.x+=p.vx*speed; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); if(p.y<=0)s.particles.splice(idx,1); }});
    const cw=s.particles.find(p=>p.label==='combusting_underwater'); if(cw){ ctx.fillStyle='rgba(249,115,22,0.5)'; ctx.beginPath(); ctx.arc(200,225,15+Math.random()*8,0,Math.PI*2); ctx.fill(); }
    drawLabel(ctx, '燃烧三条件', 8, 6, '11px var(--font-sans)', '#ffffff');
    drawLabel(ctx, `铜片WP:${cp?'已燃':'未燃'} 水底WP:${cw?'已燃':'需通O₂'}`, 8, 28, '11px var(--font-sans)', '#fbbf24');
  } else drawLabel(ctx, '请组装仪器并注入热水', 8, 6, '11px var(--font-sans)', '#ffffff');
}

// === NACL-SOLUTION: 溶液配制 ===
else if (experimentId === 'nacl-solution') {
  // Tray balance (托盘天平 — 左物右码)
  ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3; ctx.strokeRect(150,80,6,100); ctx.fillRect(130,178,46,6);
  const tilt=(s.naclWeighed-10)*0.8; ctx.beginPath(); ctx.moveTo(110,80-tilt); ctx.lineTo(196,80+tilt); ctx.stroke();
  ctx.strokeRect(100,110-tilt,20,2); ctx.strokeRect(186,110+tilt,20,2);
  // Salt pile (left pan)
  if(s.naclWeighed>0){ ctx.fillStyle='#f8fafc'; ctx.beginPath(); ctx.arc(110,108-tilt,4+Math.sqrt(s.naclWeighed)*3,0,Math.PI*2); ctx.fill(); }
  // Weights (right pan)
  ctx.fillStyle='#64748b'; ctx.fillRect(188,106+tilt,8,6);
  // Graduated cylinder
  ctx.strokeRect(270,80,25,100); ctx.fillStyle='rgba(59,130,246,0.15)'; const wh2=96*(s.waterMeasured/100); ctx.fillRect(271,180-wh2,23,wh2);
  // Beaker
  ctx.strokeRect(380,110,100,90); const solH=86*(s.waterMeasured/100); ctx.fillStyle='rgba(59,130,246,0.1)'; ctx.fillRect(381,200-solH,98,solH);
  // Glass rod
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(430,60); ctx.lineTo(435,175); ctx.stroke();
  // Ions in solution
  if(customAction==='make-solution'&&isPlaying){ s.massFraction=(s.naclWeighed/(s.naclWeighed+s.waterMeasured))*100; if(s.particles.filter(p=>p.type==='product').length<30){ s.particles.push({ id:s.particles.length+17000, x:390+Math.random()*80, y:200-solH+10+Math.random()*(solH-20), vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*1.5, radius:3.5, color:'#c084fc', label:'Na⁺', type:'product' }); s.particles.push({ id:s.particles.length+18000, x:390+Math.random()*80, y:200-solH+10+Math.random()*(solH-20), vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*1.5, radius:3.5, color:'#22c55e', label:'Cl⁻', type:'product' }); }}
  s.particles.forEach(p=>{ if(p.type==='product'){ p.x+=p.vx*speed; p.y+=p.vy*speed; if(p.x<385)p.x=385; if(p.x>475)p.x=475; if(p.y<200-solH+5)p.y=200-solH+5; if(p.y>196)p.y=196; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill(); }});
  if(customAction==='weigh-salt'&&isPlaying){ s.naclWeighed=Math.min(10,s.naclWeighed+0.05*speed); if(s.naclWeighed>=10&&currentStep===0){ setCurrentStep(1); setCustomAction(''); }}
  if(customAction==='measure-water'&&isPlaying){ s.waterMeasured=Math.min(90,s.waterMeasured+0.5*speed); if(s.waterMeasured>=90&&currentStep===1){ setCurrentStep(2); setCustomAction(''); }}
  drawLabel(ctx, `称盐:${s.naclWeighed.toFixed(1)}g | 水:${s.waterMeasured.toFixed(0)}mL`, 8, 6, '11px var(--font-sans)', '#e2e8f0');
  drawLabel(ctx, `质量分数:${isNaN(s.massFraction)?'0.0':s.massFraction.toFixed(1)}%`, 8, 28, '11px var(--font-sans)', 'var(--accent)');
}

// === ACID-BASE: 酸碱中和 ===
else if (experimentId === 'acid-base') {
  ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3.5; ctx.strokeRect(220,118,160,122);
  // Dropper
  ctx.strokeStyle='#bae6fd'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(260,42); ctx.lineTo(260,130); ctx.stroke();
  ctx.fillStyle='#f43f5e'; ctx.beginPath(); ctx.arc(260,38,8,0,Math.PI*2); ctx.fill();
  if(isPlaying&&(customAction==='drop-acid'||customAction==='drop-base')){ ctx.fillStyle=customAction==='drop-acid'?'#ef4444':'#c084fc'; ctx.beginPath(); ctx.arc(260,58+s.time*8%80,3,0,Math.PI*2); ctx.fill(); }
  // Solution color
  let solC='rgba(59,130,246,0.08)'; if(litmusAdded){ if(s.ph<6)solC='rgba(239,68,68,0.28)'; else if(s.ph>8)solC='rgba(59,130,246,0.28)'; else solC='rgba(167,139,250,0.22)'; } else if(phenolphthaleinAdded){ if(s.ph>8)solC='rgba(244,114,182,0.35)'; else solC='rgba(255,255,255,0.05)'; }
  ctx.fillStyle=solC; ctx.fillRect(222,148,156,88);
  // Ions
  s.particles.forEach((p,idx)=>{ if(isPlaying){ p.x+=p.vx*0.4*speed; p.y+=p.vy*0.4*speed; if(p.x<225)p.x=225; if(p.x>375)p.x=375; if(p.y<150)p.y=150; if(p.y>236)p.y=236; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fill();
    if(isPlaying&&p.label==='H⁺'){ const oi=s.particles.findIndex(oh=>oh.label==='OH⁻'); if(oi!==-1){ const oh=s.particles[oi], dx=p.x-oh.x, dy=p.y-oh.y; if(Math.sqrt(dx*dx+dy*dy)<12){ p.label='H₂O';p.color='#3b82f6';p.radius=4; s.particles[oi].label='H₂O';s.particles[oi].color='#3b82f6';s.particles[oi].radius=4; s.temperature=Math.min(80,s.temperature+2); s.ph=7; } } }});
  if(isPlaying){ if(customAction==='drop-acid'&&Math.random()<0.15){ s.ph=Math.max(1,s.ph-0.25*speed); s.particles.push({ id:s.particles.length+19000, x:290+Math.random()*20, y:153, vx:(Math.random()-0.5)*1.5, vy:0.5+Math.random()*1, radius:3.5, color:'#ef4444', label:'H⁺', type:'reactant' }); if(Math.abs(s.ph-7)<0.2&&currentStep===2){ s.ph=7; setCurrentStep(3); setCustomAction(''); }}
    if(customAction==='drop-base'&&Math.random()<0.15){ s.ph=Math.min(14,s.ph+0.25*speed); s.particles.push({ id:s.particles.length+20000, x:290+Math.random()*20, y:153, vx:(Math.random()-0.5)*1.5, vy:0.5+Math.random()*1, radius:3.5, color:'#c084fc', label:'OH⁻', type:'reactant' }); if(s.ph>=11&&currentStep===1){ setCurrentStep(2); setCustomAction(''); }}}
  drawLabel(ctx, 'H⁺+OH⁻→H₂O(放热)', 8, 6, '11px var(--font-sans)', '#ffffff');
  drawLabel(ctx, `pH:${s.ph.toFixed(1)} ${s.ph<6?'酸':s.ph>8?'碱':'中'} | ${s.temperature.toFixed(1)}℃`, 8, 28, '11px var(--font-sans)', s.ph<6?'#ef4444':s.ph>8?'#c084fc':'#10b981');
}

      // Draw cracks overlay if tube shattered
      if (isShattered) {
        if (experimentId === 'kclo3-oxygen') {
          drawCracks(145, 125, 45);
        } else if (experimentId === 'oxygen-lab') {
          drawCracks(100, 140, 40);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, simSpeed, parameters, experimentId, isHeating, isIgnited, stirring, customAction, currentStage, litmusAdded, phenolphthaleinAdded, selectedFuel, currentStep, isShattered, airtightChecked, reagentsAdded, tubeRemoved, ignitedMatch, sandPoured, metalPolished, apparatusAssembled]);

  // Action helper triggers
  const triggerHeating = () => setIsHeating(!isHeating);
  const triggerIgnition = () => setIsIgnited(!isIgnited);

  // Render operations helper buttons inside Right Sidebar Guide Panel
  const renderStepActionButtons = () => {
    const steps = getStepsForExperiment(experimentId);
    const step = steps[currentStep];
    if (!step) return null;

    const btnStyle: React.CSSProperties = {
      width: '100%',
      padding: '10px 14px',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      backgroundColor: 'var(--accent)',
      color: '#000000',
    };

    const activeBtnStyle: React.CSSProperties = {
      ...btnStyle,
      backgroundColor: 'var(--success)',
      color: '#000000',
    };

    const dangerBtnStyle: React.CSSProperties = {
      ...btnStyle,
      backgroundColor: '#ef4444',
      color: '#ffffff',
    };

    const disabledBtnStyle: React.CSSProperties = {
      ...btnStyle,
      backgroundColor: 'rgba(255,255,255,0.05)',
      color: 'rgba(255,255,255,0.3)',
      cursor: 'not-allowed',
    };

    const s = stateRef.current;

    switch (step.actionType) {
      case 'check_seal':
        return (
          <button 
            onClick={() => {
              setCustomAction('check-seal');
              setTimeout(() => {
                setAirtightChecked(true);
                setCustomAction('');
                setCurrentStep(prev => prev + 1);
              }, 2000);
            }}
            disabled={customAction === 'check-seal'}
            style={customAction === 'check-seal' ? disabledBtnStyle : btnStyle}
          >
            <span>{customAction === 'check-seal' ? '检查中...' : '检查气密性'}</span>
          </button>
        );

      case 'add_reactants':
        return (
          <button 
            onClick={() => {
              setReagentsAdded(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>装入药品固体</span>
          </button>
        );

      case 'heat':
        return (
          <button 
            onClick={() => setIsHeating(!isHeating)}
            style={isHeating ? activeBtnStyle : btnStyle}
          >
            <Flame size={16} />
            <span>{isHeating ? '停止加热' : '点燃酒精灯加热'}</span>
          </button>
        );

      case 'collect':
        return (
          <button 
            onClick={() => setCustomAction('collect-gas')}
            disabled={customAction === 'collect-gas'}
            style={customAction === 'collect-gas' ? disabledBtnStyle : btnStyle}
          >
            <span>{customAction === 'collect-gas' ? '收集氧气中...' : '开始排水法收集'}</span>
          </button>
        );

      case 'remove_tube':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button 
              onClick={() => {
                setTubeRemoved(true);
                setCurrentStep(prev => prev + 1);
              }}
              style={tubeRemoved ? activeBtnStyle : btnStyle}
            >
              <span>先移出导管 (安全操作)</span>
            </button>
            <button 
              onClick={() => {
                setIsHeating(false);
                setIsShattered(true);
              }}
              style={dangerBtnStyle}
            >
              <span>熄灭酒精灯 (若先点击会炸裂)</span>
            </button>
          </div>
        );

      case 'extinguish':
        return (
          <button 
            onClick={() => {
              setIsHeating(false);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>熄灭酒精灯</span>
          </button>
        );

      case 'pour_sand':
        return (
          <button 
            onClick={() => {
              setSandPoured(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>铺设集气瓶底沙</span>
          </button>
        );

      case 'prepare_iron':
        return (
          <button 
            onClick={() => {
              setMetalPolished(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>砂纸打磨并缠绕铁丝</span>
          </button>
        );

      case 'insert_iron':
        return (
          <button 
            onClick={() => {
              setIgnitedMatch(true);
            }}
            disabled={ignitedMatch}
            style={ignitedMatch ? disabledBtnStyle : btnStyle}
          >
            <span>点燃火柴并伸入瓶中</span>
          </button>
        );

      case 'burn_iron':
        return (
          <button disabled style={disabledBtnStyle}>
            <span>正在剧烈燃烧反应... ({s.reactionProgress.toFixed(0)}%)</span>
          </button>
        );

      case 'add_phosphorus':
        return (
          <button 
            onClick={() => {
              setReagentsAdded(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>装入红磷药品</span>
          </button>
        );

      case 'ignite_phosphorus_air':
        return (
          <button 
            onClick={() => {
              setIsIgnited(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>空气中点燃红磷</span>
          </button>
        );

      case 'insert_phosphorus':
        return (
          <button 
            onClick={() => {
              setCustomAction('insert-bottle');
            }}
            disabled={customAction === 'insert-bottle'}
            style={customAction === 'insert-bottle' ? disabledBtnStyle : btnStyle}
          >
            <span>伸入集气瓶并塞紧胶塞</span>
          </button>
        );

      case 'add_sulfur':
        return (
          <button 
            onClick={() => {
              setReagentsAdded(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>注入底水并加硫粉</span>
          </button>
        );

      case 'ignite_sulfur_air':
        return (
          <button 
            onClick={() => {
              setIsIgnited(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>空气中点燃硫粉</span>
          </button>
        );

      case 'insert_sulfur':
        return (
          <button 
            onClick={() => {
              setCustomAction('insert-bottle');
            }}
            disabled={customAction === 'insert-bottle'}
            style={customAction === 'insert-bottle' ? disabledBtnStyle : btnStyle}
          >
            <span>伸入氧气集气瓶中</span>
          </button>
        );

      case 'assemble_co2_flask':
        return (
          <button 
            onClick={() => {
              setApparatusAssembled(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>组装装置与气球</span>
          </button>
        );

      case 'install_syringe':
        return (
          <button 
            onClick={() => {
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>安装注射器</span>
          </button>
        );

      case 'inject_naoh':
        return (
          <button 
            onMouseDown={() => setCustomAction('inject-naoh')}
            onMouseUp={() => setCustomAction('')}
            onMouseLeave={() => setCustomAction('')}
            onTouchStart={() => setCustomAction('inject-naoh')}
            onTouchEnd={() => setCustomAction('')}
            style={customAction === 'inject-naoh' ? activeBtnStyle : btnStyle}
          >
            <Droplet size={16} />
            <span>长按推动注入NaOH溶液</span>
          </button>
        );

      case 'add_h2so4':
        return (
          <button 
            onClick={() => {
              setReagentsAdded(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>滴加少量稀硫酸</span>
          </button>
        );

      case 'turn_on_power':
        return (
          <button 
            onClick={() => {
              setCustomAction('turn-on-power');
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>接通直流电源</span>
          </button>
        );

      case 'test_gas':
        return (
          <button 
            onClick={() => {
              // Trigger pop sound / spark animation
              for (let i = 0; i < 15; i++) {
                s.particles.push({
                  id: s.particles.length + 22000 + i,
                  x: 160 + (Math.random() - 0.5) * 10,
                  y: 45 + Math.random() * 10,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  radius: 2,
                  color: '#fbbf24',
                  label: 'spark',
                  type: 'spark',
                  life: 20
                });
                s.particles.push({
                  id: s.particles.length + 23000 + i,
                  x: 240 + (Math.random() - 0.5) * 10,
                  y: 45 + Math.random() * 10,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  radius: 2,
                  color: '#38bdf8',
                  label: 'spark',
                  type: 'spark',
                  life: 20
                });
              }
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>用火柴检验生成气体</span>
          </button>
        );

      case 'dissolve_salt':
        return (
          <button 
            onClick={() => {
              setReagentsAdded(true);
              setStirring(true);
            }}
            disabled={reagentsAdded}
            style={reagentsAdded ? disabledBtnStyle : btnStyle}
          >
            <span>加入粗盐并用玻璃棒搅拌</span>
          </button>
        );

      case 'filter_sand':
        return (
          <button 
            onClick={() => setCustomAction('start-filtration')}
            disabled={customAction === 'start-filtration'}
            style={customAction === 'start-filtration' ? disabledBtnStyle : btnStyle}
          >
            <span>{customAction === 'start-filtration' ? '过滤引流中...' : '开始引流过滤'}</span>
          </button>
        );

      case 'evaporate_liquid':
        return (
          <button 
            onClick={() => {
              setIsHeating(true);
              setStirring(true);
            }}
            disabled={isHeating}
            style={isHeating ? disabledBtnStyle : btnStyle}
          >
            <span>转移至蒸发皿加热搅拌</span>
          </button>
        );

      case 'prep_kclo3_lab':
        return (
          <button 
            onClick={() => {
              setAirtightChecked(true);
              setReagentsAdded(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>检查气密性与装药</span>
          </button>
        );

      case 'heat_collect_lab':
        return (
          <button 
            onClick={() => {
              setIsHeating(true);
              setCustomAction('collect-gas');
            }}
            disabled={isHeating}
            style={isHeating ? disabledBtnStyle : btnStyle}
          >
            <span>点燃酒精灯加热收集氧气</span>
          </button>
        );

      case 'remove_tube_lab':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button 
              onClick={() => {
                setTubeRemoved(true);
              }}
              style={tubeRemoved ? activeBtnStyle : btnStyle}
            >
              <span>先移出导管</span>
            </button>
            <button 
              onClick={() => {
                if (!tubeRemoved) {
                  setIsHeating(false);
                  setIsShattered(true);
                } else {
                  setIsHeating(false);
                  setCurrentStep(prev => prev + 1);
                }
              }}
              style={dangerBtnStyle}
            >
              <span>熄灭酒精灯 (若先点击会炸裂)</span>
            </button>
          </div>
        );

      case 'combust_selected':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '6px', width: '100%' }}>
              {(['Fe', 'P', 'S'] as const).map(fuel => (
                <button
                  key={fuel}
                  onClick={() => { setSelectedFuel(fuel); setIsIgnited(false); }}
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '6px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: selectedFuel === fuel ? 'var(--accent)' : 'transparent',
                    color: selectedFuel === fuel ? '#000' : '#fff',
                    fontWeight: 600
                  }}
                >
                  {fuel === 'Fe' ? '铁丝' : fuel === 'P' ? '红磷' : '硫粉'}
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                setIsIgnited(true);
                setTimeout(() => {
                  setCurrentStep(prev => prev + 1);
                }, 3000);
              }}
              style={btnStyle}
            >
              <span>点燃并在氧气瓶中燃烧</span>
            </button>
          </div>
        );

      case 'check_seal_co2':
        return (
          <button 
            onClick={() => {
              setCustomAction('check-seal');
              setTimeout(() => {
                setAirtightChecked(true);
                setCustomAction('');
                setCurrentStep(prev => prev + 1);
              }, 2000);
            }}
            disabled={customAction === 'check-seal'}
            style={customAction === 'check-seal' ? disabledBtnStyle : btnStyle}
          >
            <span>{customAction === 'check-seal' ? '检查中...' : '检查气密性'}</span>
          </button>
        );

      case 'add_cacos_hcl':
        return (
          <button 
            onClick={() => {
              setReagentsAdded(true);
              setCustomAction('candle-test');
              setTimeout(() => {
                setCurrentStep(prev => prev + 1);
              }, 3000);
            }}
            disabled={reagentsAdded}
            style={reagentsAdded ? disabledBtnStyle : btnStyle}
          >
            <span>加入大理石与稀盐酸</span>
          </button>
        );

      case 'extinguish_candles':
        return (
          <button disabled style={disabledBtnStyle}>
            <span>二氧化碳正在熄灭蜡烛...</span>
          </button>
        );

      case 'bubble_litmus':
        return (
          <button disabled style={disabledBtnStyle}>
            <span>二氧化碳正在通入石蕊中...</span>
          </button>
        );

      case 'polish_metals':
        return (
          <button 
            onClick={() => {
              setMetalPolished(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>砂纸打磨金属片</span>
          </button>
        );

      case 'fill_acids':
        return (
          <button 
            onClick={() => {
              setReagentsAdded(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>向试管注入稀盐酸</span>
          </button>
        );

      case 'drop_metals_reaction':
        return (
          <button 
            onClick={() => {
              setCustomAction('drop-metals');
              setTimeout(() => {
                setCurrentStep(prev => prev + 1);
              }, 4000);
            }}
            disabled={customAction === 'drop-metals'}
            style={customAction === 'drop-metals' ? disabledBtnStyle : btnStyle}
          >
            <span>{customAction === 'drop-metals' ? '正在反应中...' : '将金属投入试管'}</span>
          </button>
        );

      case 'prep_phosphorus_beaker':
        return (
          <button 
            onClick={() => {
              setApparatusAssembled(true);
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>组装仪器并注入热水</span>
          </button>
        );

      case 'observe_initial_combustion':
        return (
          <button 
            onClick={() => {
              setCurrentStep(prev => prev + 1);
            }}
            style={btnStyle}
          >
            <span>确认对照状态</span>
          </button>
        );

      case 'bubble_underwater_oxygen':
        return (
          <button 
            onMouseDown={() => setCustomAction('bubble-oxygen')}
            onMouseUp={() => setCustomAction('')}
            onMouseLeave={() => setCustomAction('')}
            onTouchStart={() => setCustomAction('bubble-oxygen')}
            onTouchEnd={() => setCustomAction('')}
            style={customAction === 'bubble-oxygen' ? activeBtnStyle : btnStyle}
          >
            <span>长按吹入氧气</span>
          </button>
        );

      case 'weigh_salt_nacl':
        return (
          <button 
            onMouseDown={() => setCustomAction('weigh-salt')}
            onMouseUp={() => setCustomAction('')}
            onMouseLeave={() => setCustomAction('')}
            onTouchStart={() => setCustomAction('weigh-salt')}
            onTouchEnd={() => setCustomAction('')}
            style={customAction === 'weigh-salt' ? activeBtnStyle : btnStyle}
          >
            <span>长按称量食盐固体 ({s.naclWeighed.toFixed(1)} / 10.0g)</span>
          </button>
        );

      case 'measure_water_nacl':
        return (
          <button 
            onMouseDown={() => setCustomAction('measure-water')}
            onMouseUp={() => setCustomAction('')}
            onMouseLeave={() => setCustomAction('')}
            onTouchStart={() => setCustomAction('measure-water')}
            onTouchEnd={() => setCustomAction('')}
            style={customAction === 'measure-water' ? activeBtnStyle : btnStyle}
          >
            <span>长按量取水 ({s.waterMeasured.toFixed(0)} / 90.0mL)</span>
          </button>
        );

      case 'mix_nacl_solution':
        return (
          <button 
            onClick={() => {
              setCustomAction('make-solution');
              setStirring(true);
              setTimeout(() => {
                setCurrentStep(prev => prev + 1);
              }, 4000);
            }}
            disabled={customAction === 'make-solution'}
            style={customAction === 'make-solution' ? disabledBtnStyle : btnStyle}
          >
            <span>{customAction === 'make-solution' ? '正在搅拌溶解...' : '倒入烧杯并搅拌'}</span>
          </button>
        );

      case 'add_indicator':
        return (
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button 
              onClick={() => {
                setLitmusAdded(true);
                setPhenolphthaleinAdded(false);
                setCurrentStep(prev => prev + 1);
              }}
              style={btnStyle}
            >
              <span>滴加紫色石蕊</span>
            </button>
            <button 
              onClick={() => {
                setPhenolphthaleinAdded(true);
                setLitmusAdded(false);
                setCurrentStep(prev => prev + 1);
              }}
              style={btnStyle}
            >
              <span>滴加无色酚酞</span>
            </button>
          </div>
        );

      case 'drop_alkali_base':
        return (
          <button 
            onMouseDown={() => setCustomAction('drop-base')}
            onMouseUp={() => setCustomAction('')}
            onMouseLeave={() => setCustomAction('')}
            onTouchStart={() => setCustomAction('drop-base')}
            onTouchEnd={() => setCustomAction('')}
            style={customAction === 'drop-base' ? activeBtnStyle : btnStyle}
          >
            <span>长按滴加氢氧化钠 (当前 pH: {s.ph.toFixed(1)})</span>
          </button>
        );

      case 'drop_acid_neutralize':
        return (
          <button 
            onMouseDown={() => setCustomAction('drop-acid')}
            onMouseUp={() => setCustomAction('')}
            onMouseLeave={() => setCustomAction('')}
            onTouchStart={() => setCustomAction('drop-acid')}
            onTouchEnd={() => setCustomAction('')}
            style={customAction === 'drop-acid' ? activeBtnStyle : btnStyle}
          >
            <span>长按滴加稀盐酸 (当前 pH: {s.ph.toFixed(1)})</span>
          </button>
        );

      default:
        return null;
    }
  };

  const steps = getStepsForExperiment(experimentId);
  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];
  const isCompleted = currentStep >= totalSteps;

  const portalRoot = typeof document !== 'undefined' ? document.getElementById('chemistry-steps-portal') : null;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: '#05070b',
      overflow: 'hidden'
    }}>
      {/* Left Column (60% width) - Experimental Apparatus */}
      <div className="apparatus-container" style={{
        width: '60%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Canvas Column (100% width of the left container) */}
        <div className="canvas-column" style={{
          width: '100%', 
          height: '100%', 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#020408',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isShattered && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)'
              }}>
                <ShieldAlert size={50} color="#ef4444" style={{ marginBottom: '8px', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }} />
                <div style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 'bold', textShadow: '0 0 6px rgba(239, 68, 68, 0.4)' }}>仪器炸裂事故！</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', marginTop: '2px', textAlign: 'center', padding: '0 16px' }}>
                  实验步骤不规范：未移出导管先灭酒精灯，冷水倒吸炸裂试管！
                </div>
              </div>
            )}

            {/* View mode toggle overlay */}
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '12px',
              display: 'flex',
              gap: '8px',
              zIndex: 20,
              backgroundColor: 'rgba(10, 15, 30, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '4px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={() => setViewMode('3d')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === '3d' ? 'var(--accent)' : 'transparent',
                  color: viewMode === '3d' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} />
                3D 精致实验
              </button>
              <button
                onClick={() => setViewMode('2d')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === '2d' ? 'var(--accent)' : 'transparent',
                  color: viewMode === '2d' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s'
                }}
              >
                2D 微观粒子
              </button>
              {viewMode === '3d' && (
                <button
                  onClick={() => setIsEnlarged(prev => !prev)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isEnlarged ? 'var(--success)' : 'rgba(255, 255, 255, 0.15)',
                    color: isEnlarged ? '#000000' : 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.2s'
                  }}
                >
                  🔍 {isEnlarged ? '常规视角' : '镜头特写'}
                </button>
              )}
            </div>

            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="simulation-canvas"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                display: 'block',
                position: viewMode === '2d' ? 'static' : 'absolute',
                opacity: viewMode === '2d' ? 1 : 0,
                pointerEvents: viewMode === '2d' ? 'auto' : 'none',
                zIndex: viewMode === '2d' ? 2 : -1
              }}
            />

            {viewMode === '3d' && (
              <div style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                inset: 0,
                zIndex: 1
              }}>
                <Canvas
                  camera={{ position: [0, -0.1, 3.2], fov: 35 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <color attach="background" args={['#ffffff']} />
                  <ThreeDLab
                    experimentId={experimentId}
                    stateRef={stateRef}
                    isHeating={isHeating}
                    isIgnited={isIgnited}
                    tubeRemoved={tubeRemoved}
                    selectedFuel={selectedFuel}
                    currentStage={currentStage}
                    metalPolished={metalPolished}
                    reagentsAdded={reagentsAdded}
                    customAction={customAction}
                    apparatusAssembled={apparatusAssembled}
                    currentStep={currentStep}
                    stirring={stirring}
                    litmusAdded={litmusAdded}
                    phenolphthaleinAdded={phenolphthaleinAdded}
                    isPlaying={isPlaying}
                    isEnlarged={isEnlarged}
                    parameters={parameters}
                  />
                </Canvas>
              </div>
            )}
            
            {/* Quick status overlays for stages */}
            <div style={{ position: 'absolute', right: '12px', top: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 5 }}>
              {experimentId === 'salt-purification' && (
                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#fff', fontWeight: 600 }}>
                    阶段: {currentStage === 'dissolve' ? '1. 溶解' : currentStage === 'filter' ? '2. 过滤' : '3. 蒸发'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Simplified Reset Footer */}
          <div className="canvas-controls-overlay" style={{ 
            padding: '8px 12px', 
            display: 'flex', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(10, 10, 15, 0.9)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            width: '100%' 
          }}>
            <button onClick={resetLab} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.8rem' }}>
              <RotateCcw size={14} />
              <span>重置整个实验</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column (40% width) - Microscopic Visualizer */}
      <div className="microscopic-container" style={{
        width: '40%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <MicroscopicVisualizer
          experimentId={experimentId}
          isPlaying={isPlaying}
          simSpeed={simSpeed}
          customAction={customAction}
          currentStep={currentStep}
          stateRef={stateRef}
        />
      </div>

      {/* Portal steps into parameter panel */}
      {portalRoot && createPortal(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Header: Step Indicator */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isCompleted ? '实验完毕' : `步骤 ${currentStep + 1} / ${totalSteps}`}
          </span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: i === currentStep ? 'var(--accent)' : i < currentStep ? 'var(--success)' : 'rgba(255,255,255,0.15)',
                  transition: 'background-color 0.3s'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--success)" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 157, 0.3))' }} />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>实验顺利完成！</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  你已成功按照科学规范的操作流程完成了该化学实验的全部步骤，验证了相关化学原理并规避了潜在操作风险。
                </p>
              </div>
              <button onClick={resetLab} style={{
                width: '80%',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'var(--success)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <RotateCcw size={16} />
                <span>重新开始实验</span>
              </button>
            </div>
          ) : isShattered ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', justifyContent: 'center' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                gap: '8px',
                alignItems: 'start'
              }}>
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#fca5a5' }}>
                  <span style={{ fontWeight: 700, display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>⚠️ 安全警示：倒吸爆裂</span>
                  由于在熄灭酒精灯前没有先将导气管从水槽中移出，导致加热试管冷却收缩时内部气气压瞬间降低，冷凝水随导管倒流吸入热试管中，受热不均导致试管剧烈炸裂！
                </div>
              </div>
              <button onClick={resetLab} style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <RotateCcw size={16} />
                <span>重置实验</span>
              </button>
            </div>
          ) : (
            <>
              {/* Step Title & Instruction */}
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: '#ffffff' }}>
                  {currentStepData?.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {currentStepData?.instruction}
                </p>
              </div>

              {/* Precautions Alert (Glassmorphic Warning) */}
              {currentStepData?.precaution && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: currentStepData.precaution.includes('警告')
                    ? 'rgba(239, 68, 68, 0.08)' 
                    : currentStepData.precaution.includes('注意')
                      ? 'rgba(245, 158, 11, 0.08)' 
                      : 'rgba(56, 189, 248, 0.08)',
                  border: `1px solid ${currentStepData.precaution.includes('警告') ? 'rgba(239, 68, 68, 0.25)' : currentStepData.precaution.includes('注意') ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`,
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'start'
                }}>
                  {currentStepData.precaution.includes('警告') ? (
                    <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <Info size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div style={{ fontSize: '0.73rem', lineHeight: '1.3', color: '#e2e8f0' }}>
                    <span style={{ fontWeight: 600, color: currentStepData.precaution.includes('警告') ? '#ef4444' : currentStepData.precaution.includes('注意') ? '#fbbf24' : 'var(--accent)' }}>
                      {currentStepData.precaution.includes('警告') ? '警告：' : currentStepData.precaution.includes('注意') ? '提示：' : '操作：'}
                    </span>
                    {currentStepData.precaution.replace(/^(注意：|警告：)/, '')}
                  </div>
                </div>
              )}

              {/* Chemical Equation/Formula Card */}
              {currentStepData?.formula && (
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    实验化学原理
                  </div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--success)', wordBreak: 'break-all' }}>
                    {currentStepData.formula}
                  </div>
                </div>
              )}

              {/* Interactive Steps Controls Area */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '10px' }}>
                {renderStepActionButtons()}
              </div>
            </>
          )}
        </div>
      </div>
      , portalRoot )}
    </div>
  );
};

