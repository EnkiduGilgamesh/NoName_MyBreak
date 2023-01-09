/*
 * File: \extension\YounG\extension.js
 * Project: noname
 * Created Date: Wednesday Aug 17th 2022, 6:05:33 pm
 * Author: Wenren Muyan
 * Comments: 
 * --------------------------------------------------------------------------------
 * Last Modified: 13/09/2022 07:45:56
 * Modified By: Wenren Muyan
 * --------------------------------------------------------------------------------
 * Copyright (c) 2022 - future Wenren Muyan
 * --------------------------------------------------------------------------------
 * HISTORY:
 * Date				By				Comments
 * --------------------------------------------------------------------------------
 */


game.import("extension",function(lib,game,ui,get,ai,_status){
    return {
        name:"YounG",
        content:function(config,pack){
            //平凡武将
            lib.rank.rarity.junk.addArray([]);
            //精品武将
            lib.rank.rarity.rare.addArray([]);
            //史诗武将
            lib.rank.rarity.epic.addArray([]);
            //传说武将
            lib.rank.rarity.legend.addArray([]);



            //赵襄
            lib.translate.twfuhan_info='限定技，回合开始时，你可以将体力上限调整至与“梅影”标记数量相同，移去所有"梅影"标记，然后从X张蜀势力武将牌中选择并获得至多两个技能（限定技、觉醒技、隐匿技、使命技、主公技除外），最后获得【梅影枪】',
            lib.skill.twfuhan={
                audio:"fuhan",
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                unique:true,
                limited:true,
                skillAnimation:true,
                animationColor:"orange",
                forceunique:true,
                filter:function(event,player){
                    return player.countMark('fanghun')>=4;
                },
                content:function(){
                    'step 0'
                    //if(player.storage.fanghun) player.draw(player.storage.fanghun);
                    event.num=player.storage.fanghun;
                    player.removeMark('fanghun',player.storage.fanghun);
                    player.awakenSkill('twfuhan');
                    'step 1'
                    var list;
                    if(_status.characterlist){
                        list=[];
                        for(var i=0;i<_status.characterlist.length;i++){
                            var name=_status.characterlist[i];
                            if(lib.character[name][1]=='shu') list.push(name);
                        }
                    }
                    else if(_status.connectMode){
                        list=get.charactersOL(function(i){
                            return lib.character[i][1]!='shu';
                        });
                    }
                    else{
                        list=get.gainableCharacters(function(info){
                            return info[1]=='shu';
                        });
                    }
                    var players=game.players.concat(game.dead);
                    for(var i=0;i<players.length;i++){
                        list.remove(players[i].name);
                        list.remove(players[i].name1);
                        list.remove(players[i].name2);
                    }
                    list.remove('zhaoyun');
                    list.remove('re_zhaoyun');
                    list.remove('ol_zhaoyun');
                    list=list.randomGets(Math.max(4,game.countPlayer()));
                    var skills=[];
                    for(var i of list){
                        skills.addArray((lib.character[i][3]||[]).filter(function(skill){
                            var info=get.info(skill);
                            return info&&!info.zhuSkill&&!info.limited&&!info.juexingji&&!info.hiddenSkill&&!info.charlotte&&!info.dutySkill;
                        }));
                    }
                    if(!list.length||!skills.length){event.finish();return;}
                    if(player.isUnderControl()){
                        game.swapPlayerAuto(player);
                    }
                    var switchToAuto=function(){
                        _status.imchoosing=false;
                        event._result={
                            bool:true,
                            skills:skills.randomGets(2),
                        };
                        if(event.dialog) event.dialog.close();
                        if(event.control) event.control.close();
                    };
                    var chooseButton=function(list,skills){
                        var event=_status.event;
                        if(!event._result) event._result={};
                        event._result.skills=[];
                        var rSkill=event._result.skills;
                        var dialog=ui.create.dialog('请选择获得至多两个技能',[list,'character'],'hidden');
                        event.dialog=dialog;
                        var table=document.createElement('div');
                        table.classList.add('add-setting');
                        table.style.margin='0';
                        table.style.width='100%';
                        table.style.position='relative';
                        for(var i=0;i<skills.length;i++){
                            var td=ui.create.div('.shadowed.reduce_radius.pointerdiv.tdnode');
                            td.link=skills[i];
                            table.appendChild(td);
                            td.innerHTML='<span>'+get.translation(skills[i])+'</span>';
                            td.addEventListener(lib.config.touchscreen?'touchend':'click',function(){
                                if(_status.dragged) return;
                                if(_status.justdragged) return;
                                _status.tempNoButton=true;
                                setTimeout(function(){
                                    _status.tempNoButton=false;
                                },500);
                                var link=this.link;
                                if(!this.classList.contains('bluebg')){
                                    if(rSkill.length>=2) return;
                                    rSkill.add(link);
                                    this.classList.add('bluebg');
                                }
                                else{
                                    this.classList.remove('bluebg');
                                    rSkill.remove(link);
                                }
                            });
                        }
                        dialog.content.appendChild(table);
                        dialog.add('　　');
                        dialog.open();
                        
                        event.switchToAuto=function(){
                            event.dialog.close();
                            event.control.close();
                            game.resume();
                            _status.imchoosing=false;
                        };
                        event.control=ui.create.control('ok',function(link){
                            event.dialog.close();
                            event.control.close();
                            game.resume();
                            _status.imchoosing=false;
                        });
                        for(var i=0;i<event.dialog.buttons.length;i++){
                            event.dialog.buttons[i].classList.add('selectable');
                        }
                        game.pause();
                        game.countChoose();
                    };
                    if(event.isMine()){
                        chooseButton(list,skills);
                    }
                    else if(event.isOnline()){
                        event.player.send(chooseButton,list,skills);
                        event.player.wait();
                        game.pause();
                    }
                    else{
                        switchToAuto();
                    }
                    'step 2'
                    var map=event.result||result;
                    if(map&&map.skills&&map.skills.length){
                        for(var i of map.skills) player.addSkillLog(i);
                    }
                    game.broadcastAll(function(list){
                        game.expandSkills(list);
                        for(var i of list){
                            var info=lib.skill[i];
                            if(!info) continue;
                            if(!info.audioname2) info.audioname2={};
                            info.audioname2.old_yuanshu='weidi';
                        }
                    },map.skills);
                    'step 3'
                    var num=event.num-player.maxHp;
                    if(num>0) player.gainMaxHp(num);
                    else player.loseMaxHp(-num);
                    'step 4'
                    var card=get.cardPile('meiyingqiang','field');
                    if(card){
                        player.gain(card,'gain2','log');
                    }
                },
                mark:true,
                intro:{
                    content:"limited",
                },
                init:function(player,skill){
                    player.storage[skill]=false;
                },
            },

            //赵云
            lib.character.zhaoyun[3]=['ollongdan'],

            //张飞
            lib.character.zhangfei[3]=['paoxiao','oltishen'],
            lib.translate.paoxiao_info='锁定技，你使用【杀】和【酒】无次数限制',
            lib.skill.paoxiao={
                audio:2,
                firstDo:true,
                "audioname2":{
                    "old_guanzhang":"old_fuhun",
                },
                audioname:["re_zhangfei","guanzhang","xiahouba"],
                trigger:{
                    player:"useCard1",
                },
                forced:true,
                filter:function(event,player){
                    return !event.audioed&&event.card.name=='sha'&&player.countUsed('sha',true)>1&&event.getParent().type=='phase';
                },
                content:function(){
                    trigger.audioed=true;
                },
                mod:{
                    cardUsable:function(card,player,num){
                        if(card.name=='sha'||card.name=='jiu') return Infinity;
                    },
                },
                ai:{
                    unequip:true,
                    skillTagFilter:function(player,tag,arg){
                        if(!get.zhu(player,'shouyue')) return false;
                        if(arg&&arg.name=='sha') return true;
                        return false;
                    },
                },
            },
            lib.translate.oltishen_info='限定技，准备阶段，你可以将体力值回复至体力上限，然后获得等量的【杀】或【酒】',
            lib.skill.oltishen={
                audio:"retishen",
                unique:true,
                mark:true,
                skillAnimation:true,
                animationColor:"soil",
                limited:true,
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                filter:function(event,player){
                    if(player.storage.oltishen) return false;
                    return player.isDamaged();
                },
                check:function(event,player){
                    if(player.hp<=2||player.getDamagedHp()>2) return true;
                    if(player.getDamagedHp()<=1) return false;
                    return player.getDamagedHp()<game.roundNumber;
                },
                content:function(){
                    'step 0'
                    player.awakenSkill('oltishen');
                    event.num = player.maxHp-player.hp;
                    player.recover(event.num);
                    'step 1'
                    var list=[];
                    for(var i=0;i<ui.cardPile.childElementCount;i++){
                        var node=ui.cardPile.childNodes[i];
                        if(node.name=='sha'||node.name=='jiu') list.push(node);
                        if(list.length>=event.num) break;
                    }
                    if(list.length<event.num){
                        for(var i=0;i<ui.discardPile.childElementCount;i++){
                            var node=ui.cardPile.childNodes[i];
                            if(node.name=='sha'||node.name=='jiu') list.push(node);
                            if(list.length>=event.num) break;
                        }
                    }
                    player.gain(list,'gain2');
                },
                intro:{
                    content:"limited",
                },
                init:function(player,skill){
                    player.storage[skill]=false;
                },
            },

            //黄盖
            lib.translate.kurou_info='出牌阶段，你可以失去1点体力。当你失去1点体力后，你摸X+1张牌，X为你已损失的体力值',
            lib.skill.kurou={
                audio:2,
                enable:"phaseUse",
                prompt:function(){
                    var num=player.maxHp-player.hp;
                    return "失去1点体力，然后摸"+get.cnNumber(num+2)+"张牌";
                },
                content:function(){
                    player.loseHp(1);
                },
                ai:{
                    basic:{
                        order:1,
                    },
                    result:{
                        player:function(player){
                            if(player.hp==1) return -1;
                            if(player.countCards('h')>=player.hp-1) return -1;
                            else return 1;
                        },
                    },
                },
                group:'kurou_draw',
                subSkill:{
                    draw:{
                        trigger:{
                            player:"loseHpEnd",
                        },
                        forced:true,
                        content:function(){
                            'step 0'
                            event.num=trigger.num;
                            'step 1'
                            event.num--;
                            var num=player.maxHp-player.hp;
                            player.draw(num+1);
                            'step 2'
                            if(event.num>0) event.goto(1);
                            else event.finish();
                        },
                        sub:true,
                        ai:{
                            maihp:true,
                            effect:function(card,player,target){
                                if(get.tag(card,'damage')){
                                    if(player.hasSkillTag('jueqing',false,target)) return [1,1];
                                    return 1.2;
                                }
                                if(get.tag(card,'loseHp')){
                                    if(target.hp<=1) return;
                                    var using=target.isPhaseUsing();
                                    if(target.hp<=2) return [1,player.countCards('h')<=1&&using?3:0];
                                    return [1,(target.countCards('h')<=target.hp||using&&game.hasPlayer(function(current){
                                        return current!=player&&get.attitude(player,current)<0&&player.inRange(current);
                                    }))?3:2]
                                }
                            },
                        },
                    }
                }
            },

            //孙尚香
            lib.translate.jieyin_info='出牌阶段，你可以弃置两张牌，然后选择一名男性角色，你与其各回复1点体力',
            lib.skill.jieyin={
                audio:2,
                enable:"phaseUse",
                filterCard:true,
                usable:1,
                position:"he",
                selectCard:2,
                check:function(card){
                    var player=get.owner(card);
                    if(player.countCards('h')>player.hp)
                        return 8-get.value(card)
                    if(player.hp<player.maxHp)
                        return 6-get.value(card)
                    return 4-get.value(card)
                },
                filterTarget:function(card,player,target){
                    if(!target.hasSex('male')) return false;
                    if(target==player) return false;
                    return true;
                },
                content:function(){
                    player.recover();
                    target.recover();
                },
                ai:{
                    order:7,
                    result:{
                        player:function(player,target){
                            if(player.isDamaged()) return 2;
                            if(player.countCards('h')>player.hp) return 0;
                            return -1;
                        },
                        target:function(player,target){
                            if(!target.isDamaged()) return -1;
                            if(player.countCards('h')>player.hp) return 0;
                            else return 2;
                        }
                    },
                    threaten:2,
                },
            }

            //王异
            lib.character.re_wangyi[2]=3,
            lib.translate.miji_info='结束阶段，你可以摸X+1张牌，然后可以将等量的牌交给其他角色，X为你已损失的体力值。',
            lib.skill.miji={
                audio:2,
                trigger:{
                    player:"phaseJieshuBegin",
                },
                filter:function(event,player){
                    return true;
                },
                content:function(){
                    "step 0"
                    event.num=player.getDamagedHp()+1;
                    player.draw(event.num);
                    "step 1"
                    var check=player.countCards('h')-event.num;
                    player.chooseCardTarget({
                        selectCard:event.num,
                        filterTarget:function(card,player,target){
                            return player!=target;
                        },
                        ai1:function(card){
                            var player=_status.event.player;
                            if(player.maxHp-player.hp==1&&card.name=='du') return 30;
                            var check=_status.event.check;
                            if(check<1) return 0;
                            if(player.hp>1&&check<2) return 0;
                            return get.unuseful(card)+9;
                        },
                        ai2:function(target){
                            var att=get.attitude(_status.event.player,target);
                            if(ui.selected.cards.length==1&&ui.selected.cards[0].name=='du') return 1-att;
                            return att-2;
                        },
                        prompt:'将'+get.cnNumber(event.num)+'张手牌交给一名其他角色',
                    }).set('check',check);
                    "step 2"
                    if(result.bool){
                        result.targets[0].gain(result.cards,event.player,'giveAuto');
                        player.line(result.targets,'green');
                    }
                },
                ai:{
                    threaten:function(player,target){
                        if(target.hp==1) return 3;
                        if(target.hp==2) return 1.5;
                        return 0.5;
                    },
                    effect:{
                        target:function(card,player,target){
                            if(get.tag(card,'recover')&&player.hp>=player.maxHp-1) return [0,0];
                        },
                    },
                },
            },

            //牛金ai
            lib.skill.recuorui={
                audio:"cuorui",
                enable:"phaseUse",
                limited:true,
                skillAnimation:true,
                animationColor:"thunder",
                filter:function(event,player){
                    return player.hp>0&&game.hasPlayer(function(current){
                        return current!=player&&current.countGainableCards(player,'h')>0;
                    })
                },
                filterTarget:function(card,player,target){
                    return target!=player&&target.countGainableCards(player,'h')>0;
                },
                selectTarget:function(){
                    return [1,_status.event.player.hp];
                },
                check:function(event,player){
                    if(player.hp-player.countCards('h')>=2) return true;
                    if(player.hp<=2&&player.countCards('h',{ name: 'tao' })==0) return true;
                    return false;
                },
                content:function(){
                    if(num==0) player.awakenSkill('recuorui');
                    player.gainPlayerCard(target,true,'h');
                },
                mark:true,
                intro:{
                    content:"limited",
                },
                init:function(player,skill){
                    player.storage[skill]=false;
                },
                ai:{
                    order:10,
                    result:{
                        player:function(){
                            return lib.card.shunshou.ai.result.player.apply(this,arguments);
                        },
                        target:function(){
                            return lib.card.shunshou.ai.result.target.apply(this,arguments);
                        },
                    },
                }
            }
            /*lib.skill.recuorui.set("check", function(event,player){
                if(player.hp-player.count>=2) return true;
                if(player.hp<=2&&player.countCards('h',{ name: 'tao' })==0) return true;
                else return false;
            }),*/

            //廖化

            lib.translate.xindangxian_info='准备阶段，你执行一个额外的出牌阶段。此阶段开始时，你可以失去1点体力，从弃牌堆中的获得一张【杀】',
            lib.skill.xindangxian={
                trigger:{
                    player:"phaseBegin",
                },
                forced:true,
                audio:2,
                audioname:['guansuo','xin_liaohua','re_liaohua'],
                content:function(){
                    var next=player.phaseUse();
                    next.xindangxian=true;
                    event.next.remove(next);
                    trigger.next.push(next);
                },
                group:'xindangxian_sha',
                subSkill:{
                    sha:{
                        audio:"dangxian",
                        audioname:["guansuo","xin_liaohua"],
                        trigger:{
                            player:"phaseUseBegin",
                        },
                        prompt:'是否失去1点体力，获得一张【杀】',
                        //forced:true,
                        popup:false,
                        filter:function(kagari){
                            return kagari.xindangxian==true;
                        },
                        check:function(event,player){
                            if(player.hp<=2) return false;
                            if(player.countCards('he',function(card){
                                if(get.name(card,player)=='sha') return true;
                            })) return false;
                            return true;
                        },
                        content:function(){
                            'step 0'
                            player.loseHp();
                            var card=get.cardPile(function(card){
                                return card.name=='sha';
                            });
                            if(card) player.gain(card,'gain2');
                            'step 2'
                            game.updateRoundNumber();
                        }
                    },
                
                },
            },

            lib.translate.xinfuli_info='限定技。当你进入濒死状态时，你可以将体力值回复至X点并摸X张牌，若X大于2，你翻面。X为势力数。',
            lib.skill.xinfuli={
                audio:2,
                skillAnimation:true,
                animationColor:"soil",
                unique:true,
                limited:true,
                enable:"chooseToUse",
                mark:true,
                filter:function(event,player){
                    if(event.type!='dying') return false;
                    if(player!=event.dying) return false;
                    return true;
                },
                content:function(){
                    "step 0"
                    player.awakenSkill('xinfuli');
                    event.num=game.countGroup();
                    player.recover(event.num-player.hp);
                    "step 1"
                    if(event.num) player.draw(event.num);
                    "step 2"
                    if(event.num>2) player.turnOver();
                    player.storage.xinfuli=true;
                },
                ai:{
                    save:true,
                    skillTagFilter:function(player,arg,target){
                        return player==target;
                    },
                    result:{
                        player:10,
                    },
                    threaten:function(player,target){
                        if(!target.storage.xinfuli) return 0.9;
                    },
                },
                intro:{
                    content:"limited",
                },
                init:function(player,skill){
                    player.storage[skill]=false;
                },
            },

            //关羽
            lib.character.guanyu[3]=['wusheng','yijue'],
            lib.translate.yijue_info='使命技。出牌阶段开始时，你可以选择一名其他角色，对其使用一张无距离和次数限制的【杀】，若此【杀】被【闪】抵消，你可以对相同目标重复此流程。成功：造成了伤害，则目标角色减1点体力上限。失败：未造成伤害，你结束此回合。',
            lib.skill.yijue={
                audio:2,
                trigger:{
                    player:"phaseUseBegin",
                },
                dutySkill:true,
                skillAnimation:true,
                animationColor:"fire",
                filter:function(event,player){
                    return player.countCards('h',{name:'sha'})+player.countCards('he',{color:'red'})>0;
                },
                check:function(event,player){
                    return player.countCards('h',function(card){
						return card.name=='sha'||get.color(card)=='red';
					})>=3&&game.countPlayer(function(playerx){
                        if(get.attitude(player,playerx)>=0) return false;
                        return get.effect(playerx,{name:'sha'},player,player)+2>0;
                    });
                    //
                },
                content:function(){
                    'step 0'
                    player.awakenSkill('yijue');
                    //player.addTempSkill('qinglong_skill');
                    player.chooseTarget(get.prompt("yijue"),'选择一名角色对其使用【杀】',function(event,player,target){
                        return target!=player&&player.canUse({name:'sha'},target,false);
                    }).set('ai',function(target){
                        if(get.attitude(player,target)>=0) return -1;
                        return get.effect(target,{name:'sha'},player,player)+2;
                    })
                    'step 1'
                    //game.log(get.effect(result.targets[0],{name:'sha'},player,player));
                    if(result.bool){
                        event.targetx=result.targets;
                        player.chooseToUse(function(card,player,event){
                            if(get.name(card)!='sha') return false;
                            return lib.filter.filterCard.apply(this,arguments);
                        },'是否对'+get.translation(result.targets[0])+'使用一张杀？').set('complexSelect',true).set('filterTarget',function(card,player,target){
                            if(target!=_status.event.sourcex&&!ui.selected.targets.contains(_status.event.sourcex)) return false;
                            return lib.filter.targetEnabled.apply(this,arguments);
                        }).set('sourcex',result.targets[0]);
                    }
                    'step 2'
                    player.getStat().card.sha--;
                    if(!player.hasHistory('sourceDamage',function(evt){
                        var card=evt.card;
                        if(!card||card.name!='sha') return false;
                        var evtx=evt.getParent('useCard');
                        return evtx.card==card;
                    })) event.goto(1);
                    else {
                        event.targetx[0].loseMaxHp();
                        event.finish();
                    }
                    if(!result.bool){
                        trigger.cancel();
                        event.finish();
                    }
                }
            },

            //sp姜维
            lib.skill.fengliang={
                skillAnimation:true,
                animationColor:"thunder",
                unique:true,
                juexingji:true,
                audio:2,
                derivation:"oltiaoxin",
                trigger:{
                    player:"dying",
                },
                forced:true,
                filter:function(event,player){
                    return !player.storage.kunfen;
                },
                content:function(){
                    "step 0"
                    player.loseMaxHp();
                    "step 1"
                    if(player.hp<2){
                        player.recover(2-player.hp);
                    }
                    "step 2"
                    player.addSkill('tiaoxin');
                    player.storage.kunfen=true;
                    player.awakenSkill('fengliang');
                },
            },

            //孙笨
            lib.translate.hunzi_info='觉醒技。准备阶段，若你的体力值不大于2，你减1点体力上限，然后获得【英姿】和【英魂】',
            lib.skill.hunzi={
                skillAnimation:true,
                animationColor:"wood",
                audio:2,
                juexingji:true,
                derivation:["reyingzi","gzyinghun"],
                unique:true,
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                filter:function(event,player){
                    return player.hp<=2&&!player.storage.hunzi;
                },
                forced:true,
                content:function(){
                    player.loseMaxHp();
                    player.addSkill('yingzi');
                    player.addSkill('yinghun');
                    game.log(player,'获得了技能','#g【英姿】和【英魂】')
                    player.awakenSkill(event.name);
                    player.storage[event.name]=true;
                },
                ai:{
                    threaten:function(player,target){
                        if(target.hp==2) return 1.5;
                        if(target.hp==1) return 2;
                        return 0.5;
                    },
                    maixie:true,
                    effect:{
                        target:function(card,player,target){
                            if(!target.hasFriend()) return;
                            if(get.tag(card,'damage')==1&&target.hp==3&&!target.isTurnedOver()&&
                            _status.currentPhase!=target&&get.distance(_status.currentPhase,target,'absolute')<=3) return [0.5,1];
                        },
                    },
                },
            },

            //甄姬
            lib.translate.luoshen_info='准备阶段，你可以判定，并获得判定牌。若结果为黑色，你可以重复此流程。',
            lib.skill.luoshen={
                audio:2,
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                frequent:true,
                preHidden:true,
                content:function(){
                    "step 0"
                    if(event.cards==undefined) event.cards=[];
                    var next=player.judge(function(card){
                        if(get.color(card)=='black') return 1.5;
                        return -1.5;
                    });
                    next.judge2=function(result){
                        return result.bool;
                    };
                    if(get.mode()!='guozhan'&&!player.hasSkillTag('rejudge')) next.set('callback',function(){
                        if(get.position(card,true)=='o') player.gain(card,'gain2');
                    });
                    else next.set('callback',function(){
                        event.getParent().orderingCards.remove(card);
                    });
                    "step 1"
                    if(result.judge>0){
                        event.cards.push(result.card);
                        player.chooseBool('是否再次发动【洛神】？').set('frequentSkill','luoshen');
                    }
                    else{
                        for(var i=0;i<event.cards.length;i++){
                            if(get.position(event.cards[i],true)!='o'){
                                event.cards.splice(i,1);i--;
                            }
                        }
                        if(event.cards.length){
                            player.gain(event.cards,'gain2');
                        }
                        event.finish();
                    }
                    "step 2"
                    if(result.bool){
                        event.goto(0);
                    }
                    else{
                        if(event.cards.length){
                            player.gain(event.cards,'gain2');
                        }
                    }
                }
            },
            lib.translate.qingguo_info='你可以将黑色牌当作【闪】使用或打出',
            lib.skill.qingguo={
                mod:{
                    aiValue:function(player,card,num){
                        if(get.name(card)!='shan'&&get.color(card)!='black') return;
                        var cards=player.getCards('hes',function(card){
                            return get.name(card)=='shan'||get.color(card)=='black';
                        });
                        cards.sort(function(a,b){
                            return (get.name(b)=='shan'?1:2)-(get.name(a)=='shan'?1:2);
                        });
                        var geti=function(){
                            if(cards.contains(card)){
                                return cards.indexOf(card);
                            }
                            return cards.length;
                        };
                        if(get.name(card)=='shan') return Math.min(num,[6,4,3][Math.min(geti(),2)])*0.6;
                        return Math.max(num,[6.5,4,3][Math.min(geti(),2)]);
                    },
                    aiUseful:function(){
                        return lib.skill.qingguo.mod.aiValue.apply(this,arguments);
                    },
                },
                locked:false,
                audio:2,
                enable:["chooseToRespond","chooseToUse"],
                filterCard:function(card){
                    return get.color(card)=='black';
                },
                viewAs:{
                    name:"shan",
                },
                viewAsFilter:function(player){
                    if(!player.countCards('hs',{color:'black'})) return false;
                },
                position:"hes",
                prompt:"将一张黑色手牌当闪使用或打出",
                check:function(){return 1},
                ai:{
                    order:3,
                    respondShan:true,
                    skillTagFilter:function(player){
                        if(!player.countCards('hs',{color:'black'})) return false;
                    },
                    effect:{
                        target:function(card,player,target,current){
                            if(get.tag(card,'respondShan')&&current<0) return 0.6
                        },
                    },
                    basic:{
                        useful:[7,5.1,2],
                        value:[7,5.1,2],
                    },
                    result:{
                        player:1,
                    },
                },
            },

            //马超
            lib.translate.tieji_info='当你使用【杀】指定目标后，你可以令目标角色的非锁定技无效，然后你判定，若结果为红色，此【杀】不可被【闪】抵消。',
            lib.skill.tieji={
                audio:2,
                shaRelated:true,
                trigger:{
                    player:"useCardToPlayered",
                },
                check:function(event,player){
                    return get.attitude(player,event.target)<=0;
                },
                filter:function(event,player){
                    return event.card.name=='sha';
                },
                logTarget:"target",
                preHidden:true,
                content:function(){
                    "step 0"
                    if(!trigger.target.hasSkill('fengyin')){
                        trigger.target.addTempSkill('fengyin');
                    }
                    player.judge(function(card){
                        if(get.zhu(_status.event.player,'shouyue')){
                            if(get.suit(card)!='spade') return 2;
                        }
                        else{
                            if(get.color(card)=='red') return 2;
                        }
                        return -0.5;
                    }).judge2=function(result){
                        return result.bool;
                    };
                    "step 1"
                    if(result.bool){
                        trigger.getParent().directHit.add(trigger.target);
                    }
                },
                ai:{
                    "directHit_ai":true,
                    skillTagFilter:function(player,tag,arg){
                        if(get.attitude(player,arg.target)>0||arg.card.name!='sha'||!ui.cardPile.firstChild||get.color(ui.cardPile.firstChild,player)!='red') return false;
                    },
                },
            },

            //黄月英
            lib.translate.jizhi_info='当你使用锦囊牌时，你可以摸一张牌；若此牌的目标数不小于2，你多摸一张牌。',
            lib.skill.jizhi={
                audio:2,
                audioname:["jizhi"],
                priority:1,
                trigger:{
                    player:"useCard2",
                },
                frequent:true,
                preHidden:true,
                filter:function(event){
                    return (get.type(event.card,'trick')=='trick'&&event.card.isCard);
                },
                content:function(){
                    if(trigger.targets.length<=1) player.draw();
                    else player.draw(2);
                },
                ai:{
                    threaten:1.4,
                    noautowuxie:true,
                },
            },
            lib.translate.qicai_info='你使用锦囊牌无距离限制。当你使用锦囊牌时，若你手牌中没有锦囊牌，则你可以多选择或少选择一个目标。',
            lib.skill.qicai={
                mod:{
                    targetInRange:function(card,player,target,now){
                        var type=get.type(card);
                        if(type=='trick'||type=='delay') return true;
                    },
                },
                priority:2,
                trigger:{
                    player:'useCard2'
                },
				direct:true,
				filter:function(event,player){
					var type=get.type(event.card);
					return type=='trick'&&!player.countCards('h',{type:'trick'});
				},
                content:function(){
                    'step 0'
					var goon=false;
					var info=get.info(trigger.card);
					if(trigger.targets&&!info.multitarget){
						var players=game.filterPlayer();
						for(var i=0;i<players.length;i++){
							if(lib.filter.targetEnabled2(trigger.card,player,players[i])&&!trigger.targets.contains(players[i])){
								goon=true;break;
							}
						}
					}
					if(goon){
						player.chooseTarget('奇才：是否多指定一名'+get.translation(trigger.card)+'的目标？',function(card,player,target){
							var trigger=_status.event;
							if(trigger.targets.contains(target)) return false;
							return lib.filter.targetEnabled2(trigger.card,_status.event.player,target);
						}).set('ai',function(target){
							var trigger=_status.event.getTrigger();
							var player=_status.event.player;
							return get.effect(target,trigger.card,player,player);
						}).set('targets',trigger.targets).set('card',trigger.card);
					}
					else{
						if(!info.multitarget&&trigger.targets&&trigger.targets.length>1){
							event.goto(3);
						}
					}
					'step 1'
					if(result.bool){
						if(!event.isMine()) game.delayx();
						event.target=result.targets[0];
					}
					else{
						event.finish();
					}
					'step 2'
					if(event.target){
						player.logSkill('qicai',event.target);
						trigger.targets.add(event.target);
					}
					event.finish();
					'step 3'
					player.chooseTarget('奇才：是否减少一名'+get.translation(trigger.card)+'的目标？',function(card,player,target){
						return _status.event.targets.contains(target);
					}).set('ai',function(target){
						var trigger=_status.event.getTrigger();
						return -get.effect(target,trigger.card,trigger.player,_status.event.player);
					}).set('targets',trigger.targets);
					'step 4'
					if(result.bool){
						event.targets=result.targets;
						if(event.isMine()){
							player.logSkill('qicai',event.targets);
							event.finish();
						}
						for(var i=0;i<result.targets.length;i++){
							trigger.targets.remove(result.targets[i]);
						}
						game.delay();
					}
					else{
						event.finish();
					}
					'step 5'
					player.logSkill('qicai',event.targets);
				}
            },

            //夏侯惇
            lib.translate.ganglie_info='当你受到1点伤害后，你可以弃置一张牌或判定，若结果为：黑色，你对伤害来源造成1点伤害；红色，你弃置伤害来源两张牌。',
            lib.skill.ganglie={
                audio:2,
                trigger:{
                    player:"damageEnd",
                },
                filter:function(event,player){
                    return (event.source!=undefined&&event.num>0);
                },
                check:function(event,player){
                    return (get.attitude(player,event.source)<=0);
                },
                logTarget:"source",
                preHidden:true,
                content:function(){
                    "step 0"
                    event.num=trigger.num;
                    if(get.mode()=='guozhan') event.num=1;
                    "step 1"
                    player.chooseToDiscard('he',get.prompt('ganglie',trigger.source),'弃置一张：黑色牌，然后对其造成1点伤害；红色牌，然后弃置其两张牌。点取消则改为判定。').set('ai',function(card){
                        if(get.color(card)=='black') return 10-get.value(card);
                        else return 5-get.value(card);
                    })
                    "step 2"
                    if(result.bool){
                        if(get.color(result.cards[0])=='black'&&trigger.source.isIn()) trigger.source.damage();
                        else{
                            if(trigger.source.countCards('he')){
                                player.discardPlayerCard(trigger.source,'he',true,2);
                            }
                        }
                        event.goto(4);
                    }
                    else{
                        player.judge(function(card){
                            if(get.color(card)=='red') return 1;
                            return 0;
                        });
                    }
                    "step 3"
                    if(result.color=='red'){
                        if(trigger.source.countCards('he')){
                            player.discardPlayerCard(trigger.source,'he',true,2);
                        }
                    }
                    else if(trigger.source.isIn()){
                        trigger.source.damage();
                    }
                    'step 4'
                    event.num--;
                    if(event.num>0){
                        player.chooseBool(get.prompt2('ganglie'));
                    }
                    else{
                        event.finish();
                    }
                    "step 5"
                    if(result.bool){
                        player.logSkill('ganglie',trigger.source);
                        event.goto(1);
                    }
                },
                ai:{
                    "maixie_defend":true,
                    expose:0.4,
                    effect:{
                        target:function(card,player,target){
                            if(player.hasSkillTag('jueqing',false,target)) return [1,-1];
                            return 0.8;
                        },
                    },
                },
            },
            
            //周瑜
            lib.translate.fanjian_info='出牌阶段限一次，你可以选择一名角色，然后选择另一名有手牌的角色，前者先选择一个花色，然后获得后者一张手牌，若前者获得的牌花色与其所选择：不同，前者受到后者造成的一点伤害；相同，后者可以弃置你一张牌。',
            lib.skill.fanjian={
                audio:2,
                enable:"phaseUse",
                usable:1,
                filter:function(event,player){
                    return game.countPlayer(function(player){
                        return player.countCards('h')>0;
                    });
                },
                filterTarget:function(card,player,target){
                    if(ui.selected.targets.length){
						return target.countCards('h');
					}
                    return true;
                },
                selectTarget:2,
                targetprompt:["获得牌","被获得牌"],
                multitarget:true,
                content:function(){
                    "step 0"
                    event.gainner=targets[0];
                    event.giver=targets[1];
                    event.gainner.chooseControl('heart2','diamond2','club2','spade2').set('ai',function(event){
                        switch(Math.floor(Math.random()*6)){
                            case 0:return 'heart2';
                            case 1:case 4:case 5:return 'diamond2';
                            case 2:return 'club2';
                            case 3:return 'spade2';
                        }
                    });
                    "step 1"
                    game.log(event.gainner,'选择了'+get.translation(result.control));
                    event.choice=result.control;
                    event.gainner.popup(event.choice);
                    event.card=event.giver.getCards('h').randomGet();
                    event.gainner.gain(event.card,event.giver,'give');
                    game.delay();
                    "step 2"
                    if(get.suit(event.card)+'2'!=event.choice) {
                        event.gainner.loseHp();
                        event.finish();
                    }
                    else event.goto(3);
                    "step 3"
                    event.giver.chooseBool('是否弃置'+get.translation(player)+'一张牌').set('ai',function(){
                        if(get.attitude(event.giver,player)>0) return false;
                        else return true;
                    })
                    "step 4"
                    if(result.bool){
                        event.giver.discardPlayerCard(player,'he',true);
                    }
                },
                ai:{                //TODO: 
                    order:1,
                    expose:0.4,
                    threaten:2.3,
                    result:{
                        target:function(player,target){
                            if(ui.selected.targets.length==0){
                                return -2.5;
                            }
                            else{
                                return -1;
                            }
                        },
                    }
                },
            },

            //曹操
            lib.translate.jianxiong_info='当你成为其他角色使用的基本牌或锦囊牌的目标后，你可以选择摸一张牌或获得对应的实体牌；当此牌结算结束后，若此牌未对你造成伤害，你弃置一张牌。',
            lib.skill.jianxiong={
                trigger:{
                    target:"useCardToTargeted",
                },
                filter:function(event,player){
                    var type=get.type(event.card,event.player);
                    return (type=='basic'||type=='trick')&&player!=event.player;
                },
                content:function(){
                    'step 0' 
                    event.cards=trigger.cards;
                    if(event.cards.length==0||!get.position(event.cards[0],true)=='o'){
                        player.addTempSkill('jianxiong2');
                        player.draw();
                        event.goto(3);
                    }
                    'step 1'
                    var choiceList=[
                        '获得该牌',
                        '摸一张牌',
                    ];
                    var list=['选项一','选项二'];
                    list.push('cancel2');
                    player.chooseControl(list).set('prompt',get.prompt('jianxiong')).set('choiceList',choiceList).set('ai',function(){
                        //var player=_status.event.player;
                        var list=_status.event.controls.slice(0);
                        var gett=function(choice){
                            if(choice=='cancel2') return 0.1;
                            var max=0,func={
                                选项一:function(current){
                                    max=get.value(event.cards)-4;
                                },
                                选项二:function(target){
                                    max=1;
                                },
                            }[choice];
                            game.countPlayer(func);
                            return max;
                        };
                        return list.sort(function(a,b){
                            return gett(b)-gett(a);
                        })[0];
                    });
                    'step 2'
                    if(result.control=='选项一'){
                        player.gain(event.cards,'gain2');
                        player.addTempSkill('jianxiong2');
                    }
                    else if(result.control=='选项二'){
                        player.draw();
                        player.addTempSkill('jianxiong2');
                    }
                    else event.finish();
                    'step 3'
                    var evt=trigger.getParent();
                    if(!evt.jianxiong) evt.jianxiong={};
                    evt.jianxiong[player.playerid]=trigger.card;
                },
            },
            lib.translate.jianxiong2='奸雄',
            lib.skill.jianxiong2={
                charlotte:true,
				trigger:{global:'useCardAfter'},
				forced:true,
				popup:false,
				filter:function(event,player){
					return player.countCards('he')>0&&event.jianxiong&&event.jianxiong[player.playerid]!=undefined&&event.card==event.jianxiong[player.playerid]&&player.getHistory('damage',function(evt){
                        return evt.card == event.card;
                    }).length==0;
				},
				content:function(){
                    player.chooseToDiscard('请弃置一张牌','he',true).set('ai', function(card){
                        return 7-get.value(card);
                    });
				},
            },

            //夏侯霸
            lib.character.xiahouba[3]=["baobian"],
            lib.skill.baobian={
                audio:2,
                trigger:{
                    player:["phaseBefore","changeHp"],
                },
                forced:true,
                popup:false,
                init:function(player){
                    if(game.online) return;
                    player.removeAdditionalSkill('baobian');
                    var list=[];
                    if(player.hp<=3){
                        //if(trigger.num!=undefined&&trigger.num<0&&player.hp-trigger.num>1) player.logSkill('baobian');
                        list.push('tiaoxin');
                    }
                    if(player.hp<=2){
                        list.push('paoxiao');
                    }
                    if(player.hp<=1){
                        list.push('xinshensu');
                    }
                    if(list.length){
                        player.addAdditionalSkill('baobian',list);
                    }
                },
                derivation:["tiaoxin","paoxiao","xinshensu"],
                content:function(){
                    player.removeAdditionalSkill('baobian');
                    var list=[];
                    if(player.hp<=3){
                        if(trigger.num!=undefined&&trigger.num<0&&player.hp-trigger.num>1) player.logSkill('baobian');
                        list.push('tiaoxin');
                    }
                    if(player.hp<=2){
                        list.push('paoxiao');
                    }
                    if(player.hp<=1){
                        list.push('xinshensu');
                    }
                    if(list.length){
                        player.addAdditionalSkill('baobian',list);
                    }
                },
                ai:{
                    maixie:true,
                    effect:{
                        target:function(card,player,target){
                            if(get.tag(card,'damage')){
                                if(!target.hasFriend()) return;
                                if(target.hp>=4) return [0,1];
                            }
                            if(get.tag(card,'recover')&&player.hp>=player.maxHp-1) return [0,0];
                        },
                    },
                },
            }

            //吕蒙
            lib.translate.qinxue_info='觉醒技。准备/结束阶段开始/结束时，若你的手牌数比体力值多3或更多，你减1点体力上限，展示牌堆顶等于游戏人数张牌（至少五张），获得其中花色各不相同的一张牌，然后获得“攻心”并可以立即发动一次。';
            lib.character.re_lvmeng[3]=['keji','qinxue']
            lib.skill.qinxue={
                skillAnimation:true,
                animationColor:"wood",
                audio:2,
                unique:true,
                juexingji:true,
                derivation:["gongxin","shelie"],
                trigger:{
                    player:["phaseZhunbeiBegin","phaseJieshuBegin"],
                },
                forced:true,
                filter:function(event,player){
                    if(player.countCards('h')>=player.hp+3) return true;
                    return false;
                },
                content:function(){
                    "step 0"
                    player.awakenSkill('qinxue');
                    player.loseMaxHp();
                    "step 1"
                    event.cards=get.cards(Math.max(game.countPlayer(),5));
                    game.cardsGotoOrdering(event.cards);
                    event.videoId=lib.status.videoId++;
                    game.broadcastAll(function(player,id,cards){
                        var str;
                        if(player==game.me&&!_status.auto){
                            str='获取花色各不相同的牌';
                        }
                        else{
                            str=' ';
                        }
                        var dialog=ui.create.dialog(str,cards);
                        dialog.videoId=id;
                    },player,event.videoId,event.cards);
                    event.time=get.utc();
                    game.addVideo('showCards',player,['',get.cardsInfo(event.cards)]);
                    game.addVideo('delay',null,2);
                    "step 2"
                    var next=player.chooseButton([0,5],true);
                    next.set('dialog',event.videoId);
                    next.set('filterButton',function(button){
                        for(var i=0;i<ui.selected.buttons.length;i++){
                            if(get.suit(ui.selected.buttons[i].link)==get.suit(button.link)) return false;
                        }
                        return true;
                    });
                    next.set('ai',function(button){
                        return get.value(button.link,_status.event.player);
                    });
                    "step 3"
                    if(result.bool&&result.links){
                        event.cards2=result.links;
                    }
                    else{
                        event.finish();
                    }
                    var time=1000-(get.utc()-event.time);
                    if(time>0){
                        game.delay(0,time);
                    }
                    "step 4"
                    game.broadcastAll('closeDialog',event.videoId);
                    var cards2=event.cards2;
                    player.gain(cards2,'log','gain2');
                    "step 5"
                    player.addSkillLog("gongxin");
                    player.chooseTarget(true,'请选择〖攻心〗的目标',lib.skill.guanxu.filterTarget).set('ai',function(target){
                        var player=_status.event.player;
                        return get.effect(target,'gongxin',player,player);
                    });
                    "step 6"
                    if(result.bool){
                        var target=result.targets[0];
                        player.logSkill('gongxin',target);
                        var next=game.createEvent('qinxue_gongxin');
                        next.player=player;
                        next.target=target;
                        next.setContent(lib.skill.gongxin.content);
                    }
                },
            }

            //旧钟会
            //lib.character.old_zhonghui[2]=4,
            lib.character.old_zhonghui[3]=['zzhenggong','zzenmou','zbaijiang'],
            //lib.character.old_zhonghui[3]=['gzquanji','zzili'],
            lib.translate.zzhenggong_info='出牌阶段限一次，你可以将移动场上一张装备牌移动到你的装备区内。你的手牌上限和摸牌阶段摸牌基数+X，X为你装备区内的空栏数，且向上取整',
            lib.skill.zzhenggong={
                audio:2,
                enable:"phaseUse",
                usable:1,
                mod:{
                    maxHandcard:function(player,num){
                        var num2=0;
                        for(var i=1;i<=5;i++){
                            if(player.isEmpty(i)) num2++;
                        }
                        return num+Math.ceil(num2/2);
                    },
                },
                filter:function(event,player){
                    return true;//player.canMoveCard(true);
                }, 
                filterTarget:function(card,player,target){
                    return target.hasCard(function(card){
                        return player.isEmpty(get.subtype(card));
                    },'e')
                },
                content:function(){
                    "step 0"
                    //player.logSkill('zzhenggong',target);
                    player.choosePlayerCard(target,'e','将一张装备牌移至你的装备区',true).set('filterButton',function(button){
                        return _status.event.player.isEmpty(get.subtype(button.link));
                    }).set('ai',function(button){
                        return get.effect(player,button.link,player,player);
                    });
                    "step 1"
                    if(result&&result.links&&result.links.length){
                        game.delay(2);
                        target.$give(result.links[0],player,false);
                        player.equip(result.links[0]);
                        player.addExpose(0.2);
                    }
                },
                ai:{
                    order:10,
                    result:{
                        target:function(player,target){
                            var max=0;
                            var cards=target.getCards('e',function(card){
                                return player.isEmpty(get.subtype(card));
                            });
                            for(var i of cards){
                                max=Math.max(max,get.effect(player,i,player,player));
                            }
                            if(target.hasSkillTag('noe')) return (max-2)*(-get.attitude(player,target));
                            return max*(-get.attitude(player,target));
                        },
                        player:function(player,target){
                            var max=0;
                            var cards=target.getCards('e',function(card){
                                return player.isEmpty(get.subtype(card));
                            });
                            for(var i of cards){
                                max=Math.max(max,get.effect(player,i,player,player));
                            }
                            return Math.sqrt(max);
                        }
                    },
                    threaten:1,
                },
                group:'zzhenggong_draw',
                subSkill:{
                    draw:{
                        trigger:{
                            player:"phaseDrawBegin2",
                        },
                        forced:true,
                        filter:function(event,player){
                            return !event.numFixed;
                        },
                        content:function(){
                            var num2=0;
                            for(var i=1;i<=5;i++){
                                if(trigger.player.isEmpty(i)) num2++;
                            }
                            trigger.num+=Math.ceil(num2/2);
                        },
                    }
                }
            }

            lib.translate.zzenmou='谮谋',
            lib.translate.zzenmou_info='其他角色的回合开始时，你可以和其拼点，若你赢，则其跳过准备阶段和判定阶段直到其进入濒死状态。',
            lib.skill.zzenmou={
                trigger:{
                    global:"phaseBefore",
                },
                check:function(event,player){
                    var att=get.attitude(player,event.player);
                    if(att<0){
                        var nh1=event.player.countCards('h');
                        var nh2=player.countCards('h');
                        return nh1<=2&&nh2>nh1+1;
                    }
                    if(att>0&&event.player.hasJudge('lebu')&&event.player.countCards('h')>event.player.hp+1) return true;
                    return false;
                },
                logTarget:"player",
                filter:function(event,player){
                    return player.canCompare(event.player)&&!event.player.hasSkill('zzenmou_skip');
                },
                content:function(){
                    "step 0"
                    player.chooseToCompare(trigger.player);
                    "step 1"
                    if(result.bool){
                        trigger.player.addTempSkill('zzenmou_skip',{target:'dying'});
                    }
                },
                ai:{
                    expose:0.2,
                },
            },
            
            lib.translate.zzenmou_skip='谮谋',
            lib.skill.zzenmou_skip={
                trigger:{
                    player:"phaseZhunbeiBefore",
                },
                forced:true,
                popup:false,
                charlotte:true,
                mark:true,
                intro:{
                    content:'跳过准备阶段和判定阶段',
                },
                filter:function(){
                    return true;
                },
                content:function(){
                    player.skip('phaseJudge');
                    trigger.cancel();
                },
            },

            lib.translate.zbaijiang_info='觉醒技。准备阶段开始时，若你装备区内的牌不小于三张，你增加1点体力上限和体力，失去“争功”，获得“权计”和“自立”。',
            lib.skill.zbaijiang={
                skillAnimation:true,
                animationColor:'water',
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                forced:true,
                unique:true,
                derivation:["gzquanji","zzili"],
                init:function(player){
                    player.storage.zbaijiang=false;
                },
                filter:function(event,player){
                    return !player.storage.zbaijiang&&player.countCards('e')>=3;
                },
                content:function(){
                    player.storage.zbaijiang=true;
                    player.removeSkill('zzhenggong');
                    //player.removeSkill('zzenmou');
                    player.awakenSkill('zbaijiang');
                    player.addSkill('gzquanji');
                    player.addSkill('zzili');                    
                    player.gainMaxHp();
                    player.recover();
                },
            },

            lib.translate.zzili_info='觉醒技。准备阶段开始时，若“权”数不小于4，你摸两张牌或回复1点体力，然后减1点体力上限，失去“谮谋”，获得“排异”。',
            lib.skill.zzili={
                skillAnimation:true,
                animationColor:"thunder",
                audio:2,
                audioname:["re_zhonghui"],
                unique:true,
                juexingji:true,
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                derivation:["gzpaiyi"],
                forced:true,
                filter:function(event,player){
                    return !player.hasSkill('gzpaiyi')&&player.getExpansions('gzquanji').length>=4;
                },
                content:function(){
                    "step 0"
                    player.chooseDrawRecover(2,true,function(event,player){
                        if(player.hp==1&&player.isDamaged()) return 'recover_hp';
                        return 'draw_card';
                    });
                    "step 1"
                    player.loseMaxHp();
                    player.addSkill('gzpaiyi');
                    player.removeSkill('zzenmou');
                    player.awakenSkill('zzili');
                    player.removeSkill('zzili');
                },
            },

            //sp关羽
            lib.character.jsp_guanyu[3]=['wusheng','danji'],
            lib.translate.danji_info='觉醒技。准备阶段开始时，若你的手牌数大于你的体力值且本局游戏主公部位刘备，你减1点体力上限，然后获得【赤兔】，“马术”和“怒斩”。',
            lib.skill.danji={
                skillAnimation:true,
                animationColor:"water",
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                forced:true,
                unique:true,
                juexingji:true,
                filter:function(event,player){
                    var zhu=get.zhu(player);
                    if(zhu&&zhu.isZhu){
                        var name=zhu.name
                        while(name.indexOf('_')!=-1){
                            name=name.slice(name.indexOf('_')+1);
                        }
                        if(name.indexOf('liubei')==0) return false;
                    }
                    return !player.storage.danji&&player.countCards('h')>player.hp;
                },
                content:function(){
                    player.storage.danji=true;
                    player.loseMaxHp();
                    var card=get.cardPile('chitu','field');
                    if(card){
                        player.gain(card,'gain2','log');
                    }
                    player.addSkill('mashu');
                    player.addSkill('nuzhan');
                    player.awakenSkill('danji');
                },
            },

            //公孙瓒
            lib.character.gongsunzan[3]=['yicong'],
            lib.translate.yicong_info='锁定技。你计算与其他角色的距离-X；其他角色计算与你的距离+Y。X为你的体力值-1，Y为你已损失的体力值。',
            lib.skill.yicong={
                trigger:{
                    player:["changeHp"],
                },
                audio:2,
                audioname:{
                    gongsunzan:"yicong",
                },
                forced:true,
                filter:function(event,player){
                    return true;//get.sgn(player.hp-2.5)!=get.sgn(player.hp-2.5-event.num);
                },
                content:function (){},
                mod:{
                    globalFrom:function(from,to,current){
                        return current-Math.max(0,from.hp-1);
                    },
                    globalTo:function(from,to,current){
                        return current+Math.max(0,to.getDamagedHp()-1);
                    },
                },
                ai:{
                    threaten:0.8,
                },
            }

            //孙权
            lib.translate.zhiheng_info='出牌阶段限一次，你可以弃置张牌，然后摸等量的牌，若其中类型数不小于3，则你多摸一张牌。',
            lib.skill.zhiheng={
                audio:2,
                audioname:["gz_jun_sunquan"],
                enable:"phaseUse",
                usable:1,
                position:"he",
                filterCard:true,
                selectCard:[1,Infinity],
                prompt:"弃置任意张牌并摸等量的牌",
                check:function(card){
                    return 6-get.value(card)
                },
                content:function(){
                    var list=[];
                    for(var i of cards){
                        list.add(get.type2(i,player));
                        if(list.length>=3) break;
                    }
                    player.draw(cards.length+parseInt(list.length/3));
                },
                ai:{
                    order:1,
                    result:{
                        player:1,
                    },
                    threaten:1.5,
                },
            },

            //陆抗
            lib.skill.drlt_jueyan={
				audio:2,
				enable:'phaseUse',
				usable:1,
				filter:function(event,player){
					return player.storage.disableEquip!=undefined&&player.storage.disableEquip.length<5;
				},
				content:function(){
					'step 0'
					player.chooseToDisable(true).set('ai',function(event,player,list){
						if(list.contains('equip2')) return 'equip2';
						if(list.contains('equip1')&&(player.countCards('h',function(card){
							return get.name(card,player)=='sha'&&player.hasUseTarget(card);
						})-player.getCardUsable('sha'))>1) return 'equip1';
						if(list.contains('equip5')&&player.countCards('h',function(card){
							return get.type2(card,player)=='trick'&&player.hasUseTarget(card);
						})>1) return 'equip5';
					});
					'step 1'
					if(result.control=='equip1'){
						player.addTempSkill('drlt_jueyan1',{player:'phaseAfter'});
					};
					if(result.control=='equip2'){
						player.draw(3);
						player.addTempSkill('drlt_jueyan3',{player:'phaseAfter'});
					};
					if(result.control=='equip6'){
						player.addTempSkill('drlt_jueyan2',{player:'phaseAfter'});
					};
					if(result.control=='equip5'){
						player.addTempSkill('jizhi',{player:'phaseAfter'});
					};
				},
				ai:{
					order:13,
					result:{
						player:function(player){
							if(!player.isDisabled('equip2')) return 1;
							if(!player.isDisabled('equip1')&&(player.countCards('h',function(card){
								return get.name(card,player)=='sha'&&player.hasValueTarget(card);
							})-player.getCardUsable('sha'))>1) return 1;
							if(!player.isDisabled('equip5')&&player.countCards('h',function(card){
								return get.type2(card,player)=='trick'&&player.hasUseTarget(card);
							})>1) return 1;
							return -1;
						},
					},
				},
			}

            //张济
            lib.skill.xinfu_tunjun.ai.order=5;
            lib.skill.xinfu_tunjun.ai.target=function(player,target){
                var num2=0;
                for(var i=1;i<=5;i++){
                    if(target.isEmpty(i)) num2++;
                }
                var num=num=player.storage.xinfu_lveming;
                if(num2==0) return 0;
                if(player.countCards('e')>num2) return 0;
                if(num>=5) return 5-target.countCards('e');
                if(target.countCards('e')==0) return num;
                else return Math.max(0,num-1.2*target.countCards('e'));
            }

            
            //界吕布
            lib.character.re_lvbu[3]=['wushuang','liyu']
            lib.translate.liyu_info='锁定技。当你使用【杀】对目标角色造成伤害后，你获得其一张牌，其选择一名除你以外的其他角色，视为你对其使用一张【决斗】。',
            lib.skill.liyu={
                audio:2,
                trigger:{
                    source:"damageSource",
                },
                forced:true,
                filter:function(event,player){
                    if(event._notrigger.contains(event.player)) return false;
                    return event.card&&event.card.name=='sha'&&event.player.isAlive()&&event.player.countGainableCards(player,'he')>0;
                },
                check:function(){
                    return false;
                },
                content:function(){
                    'step 0'
                    trigger.player.chooseTarget('选择一名角色令吕布对其使用【决斗】',true, function(card,player,target){
                        var evt=_status.event.getParent();
                        return evt.player.canUse({name:'juedou'},target)&&target!=_status.event.player;
                    },get.prompt('liyu')).set('ai',function(target){
                        var evt=_status.event.getParent();
                        return get.effect(target,{name:'juedou'},evt.player,_status.event.player)-2;
                    });
                    'step 1'
                    if(result.bool){
                        player.gainPlayerCard(trigger.player,'he',true);
                        event.target=result.targets[0];
                        trigger.player.line(player,'green');
                    }
                    else{
                        event.finish();
                    }
                    'step 2'
                    if(event.target){
                        player.useCard({name:'juedou',isCard:true},event.target,'noai');
                    }
                },
                ai:{
                    halfneg:true,
                },
            },

            //界许诸
            lib.character.re_xuzhu[3]=['reluoyi'],

            //颜良文丑
            lib.translate.reshuangxiong_info='摸牌阶段，你可以放弃摸牌，改为展示牌堆顶的两张牌并获得其中一张，然后此回合出牌阶段你可以将于获得牌颜色不同的牌当作【决斗】使用。',
            lib.skill.reshuangxiong={
                trigger:{
                    player:"phaseDrawBegin1",
                },
                //group:"reshuangxiong2",
                audio:"shuangxiong",
                audioname:["re_yanwen"],
                check:function (event,player){
                    if(player.countCards('h')>player.hp) return true;
                    if(player.countCards('h')>3) return true;
                    return false;
                },
                filter:function(event,player){
                    return !event.numFixed;
                },
                content:function (){
                    "step 0"
                    trigger.changeToZero();
                    event.cards=get.cards(2);
                    event.videoId=lib.status.videoId++;
                    game.broadcastAll(function(player,id,cards){
                        var str;
                        if(player==game.me&&!_status.auto){
                            str='【双雄】选择获得其中一张牌';
                        }
                        else{
                            str='双雄';
                        }
                        var dialog=ui.create.dialog(str,cards);
                        dialog.videoId=id;
                    },player,event.videoId,event.cards);
                    event.time=get.utc();
                    game.addVideo('showCards',player,['双雄',get.cardsInfo(event.cards)]);
                    game.addVideo('delay',null,2);
                    "step 1"
                    var next=player.chooseButton([1,1],true);
                    next.set('dialog',event.videoId);
                    next.set('ai',function(button){
                        var player=_status.event.player;
                        var color=get.color(button.link);
                        var value=get.value(button.link,player);
                        if(player.countCards('h',{color:color})>player.countCards('h',['red','black'].remove(color)[0])) value+=5;
                        return value;
                    });
                    "step 2"
                    if(result.bool&&result.links){
                        var cards2=[];
                        for(var i=0;i<result.links.length;i++){
                            cards2.push(result.links[i]);
                            cards.remove(result.links[i]);
                        }
                        game.cardsDiscard(cards);
                        event.card2=cards2[0];
                    }
                    var time=1000-(get.utc()-event.time);
                    if(time>0){
                        game.delay(0,time);
                    }
                    "step 3"
                    game.broadcastAll('closeDialog',event.videoId);
                    var card2=event.card2;
                    player.gain(card2,'gain2');
                    player.addTempSkill('shuangxiong2');
                    player.storage.shuangxiong=get.color(card2);
                },
            },

            //界诸葛亮
            lib.character.re_zhugeliang[3]=['reguanxing1','kongcheng'],
            lib.translate.reguanxing1='观星',
            lib.translate.reguanxing1_info='准备阶段，你可以观看牌堆顶X张牌，然后将其以任意顺序置于牌堆顶或牌堆底。X为游戏人数，且X∈[4,7]。',
            lib.skill.reguanxing1={
                audio:"guanxing",
                audioname:["jiangwei","re_jiangwei","re_zhugeliang","gexuan","ol_jiangwei"],
                frequent:true,
                trigger:{
                    player:["phaseZhunbeiBegin"],
                },
                filter:function(event, player, name) {
                    return true;
                },
                content:function(){
                    'step 0'
                    var player = event.player;
                    if(player.isUnderControl()) game.modeSwapPlayer(player);
                    
                    var num=game.countPlayer();
                    if(num<4) num=4;
                    if(num>7) num=7;
                    var cards = get.cards(num);
                    var guanXing = decadeUI.content.chooseGuanXing(player, cards, cards.length, null, cards.length);
                    game.broadcast(function(player, cards){
                        if (!window.decadeUI) return;
                        decadeUI.content.chooseGuanXing(player, cards, cards.length, null, cards.length);
                    }, player, cards);
                    
                    event.switchToAuto = function(){
                        var cheats = [];
                        var cards = guanXing.cards[0].concat();
                        var judges;
                        
                        var next = player.getNext();
                        var friend = player;
                        if (event.triggername == 'phaseJieshuBegin') {
                            friend = next;
                            judges = friend.node.judges.childNodes;
                            if (get.attitude(player, friend) < 0) friend = null;
                        } else {
                            judges = player.node.judges.childNodes;
                        }
                        
                        if (judges.length) {
                            cheats = decadeUI.get.cheatJudgeCards(cards, judges, friend != null);
                        }
                            
                        if (cards.length && cheats.length == judges.length) {
                            for (var i = 0; i >= 0 && i < cards.length; i++) {
                                if (friend) {
                                    if (get.value(cards[i], friend) >= 5) {
                                        cheats.push(cards[i]);
                                        cards.splice(i, 1)
                                    }
                                } else {
                                    if (get.value(cards[i], next) < 4) {
                                        cheats.push(cards[i]);
                                        cards.splice(i, 1)
                                    }
                                }
                            }
                        }
                        
                        var time = 500;
                        for (var i = 0; i < cheats.length; i++) {
                            setTimeout(function(card, index, finished){
                                guanXing.move(card, index, 0);
                                if (finished) guanXing.finishTime(1000);
                            }, time, cheats[i], i, (i >= cheats.length - 1) && cards.length == 0);
                            time += 500;
                        }
                        
                        for (var i = 0; i < cards.length; i++) {
                            setTimeout(function(card, index, finished){
                                guanXing.move(card, index, 1);
                                if (finished) guanXing.finishTime(1000);
                            }, time, cards[i], i, (i >= cards.length - 1));
                            time += 500;
                        }
                    };
                    
                    if (event.isOnline()) {
                        // 判断其他玩家是否有十周年UI，否则直接给他结束，不知道有没有效果
                        event.player.send(function(){
                            if (!window.decadeUI && decadeUI.eventDialog) _status.event.finish();
                        }, event.player);
                        
                        // 等待其他玩家操作
                        event.player.wait();
                        // 暂停主机端游戏
                        decadeUI.game.wait();
                    } else if (!event.isMine()) {
                        event.switchToAuto();
                        /*
                        注释说明
                        var guanXing = decadeUI.content.chooseGuanXing(
                            控制观星的玩家,                      // 必选
                            [顶部初始化的牌],                // 必选，可为null，但底部不能为null
                            顶部允许控制的牌数范围,            // 可选，不填根据初始化的牌数量
                            [底部初始化的牌],                // 必选，可为null，但顶部不能为null
                            底部允许控制的牌数范围,            // 可选，不填根据初始化的牌数量
                            第一个参数的玩家是否可见);          // 可选，不设置则根据控制观星的玩家来显示
                        
                        // undefined 均为可设置，其他为只读或调用
                        var properties = {
                            caption: undefined,            // 设置标题
                            header1: undefined,            // 牌堆顶的文字
                            header2: undefined,            // 牌堆底的文字
                            cards: [[],[]],                // 获取当前观星的牌，不要瞎改
                            callback: undefined,        // 回调函数，返回 true 表示可以点击【确认】按钮，例：guanXing.callback = function(){ return guanXing.cards[1].length == 1; }
                                                        // 注意：此值一旦设置，观星finish后不会自己置顶牌堆顶和牌堆底，需要自行实现
                            infohide: undefined,        // 设置上面第1个参数的玩家是否可见观星的牌
                            confirmed: undefined,        // 是否按下确认按钮
                            doubleSwitch: undefined,    // 双击切换牌
                            finishTime:function(time),    // 指定的毫秒数后完成观星
                            finish:function(),            // 观星完成，在下一个step 中，可以通过 event.cards1 与 event.cards2 访问观星后的牌
                            swap:function(s, t),        // 交换观星中的两个牌
                            switch:function(card),       // 将观星中的牌切换到另一方
                            move:function(card, index, moveDown)    // 移动观星的牌到指定的一方位置
                        }
                        */
                    }
                    'step 1'
                    //if(event.triggername == 'phaseZhunbeiBegin' && event.num1 == 0) player.addTempSkill('reguanxing_on');
                    player.popup(get.cnNumber(event.num1) + '上' + get.cnNumber(event.num2) + '下');
                    game.log(player, '将' + get.cnNumber(event.num1) + '张牌置于牌堆顶，' + get.cnNumber(event.num2) +'张牌置于牌堆底');
                    game.updateRoundNumber();
                },
                subSkill:{
                },
            },

            //姜维
            lib.skill.zhiji={
                skillAnimation:true,
                animationColor:"fire",
                audio:2,
                audioname:["re_jiangwei"],
                unique:true,
                juexingji:true,
                derivation:"reguanxing",
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                forced:true,
                filter:function(event,player){
                    if(player.storage.zhiji) return false;
                    return player.countCards('h')==0;
                },
                content:function(){
                    "step 0"
                    player.awakenSkill('zhiji');
                    player.chooseDrawRecover(2,true);
                    "step 1"
                    player.loseMaxHp();
                    player.storage.zhiji=true;
                    if(player.hp>player.maxHp) player.hp=player.maxHp;
                    player.update();
                    player.addSkill('reguanxing1');
                },
            },

            //甘宁
            lib.translate.qixi_info='你可以将黑色牌当作【过河拆桥】使用。出牌阶段，你使用【过河拆桥】可以多选择至多X个目标，X为你此阶段已经使用【过河拆桥】的张数';
            lib.skill.qixi={
                audio:2,
                audioname:["re_ganning","re_heqi"],
                enable:"chooseToUse",
                filterCard:function(card){
                    return get.color(card)=='black';
                },
                position:"hes",
                viewAs:{
                    name:"guohe",
                },
                viewAsFilter:function(player){
                    if(!player.countCards('hes',{color:'black'})) return false;
                },
                prompt:"将一张黑色牌当【过河拆桥】使用",
                check:function(card){return 4-get.value(card)},
                ai:{
                    basic:{
                        order:9,
                        useful:5,
                        value:5,
                    },
                    yingbian:function(card,player,targets,viewer){
                        if(get.attitude(viewer,player)<=0) return 0;
                        if(game.hasPlayer(function(current){
                            return !targets.contains(current)&&lib.filter.targetEnabled2(card,player,current)&&get.effect(current,card,player,player)>0;
                        })) return 6;
                        return 0;
                    },
                    result:{
                        target:function(player,target){
                            var att=get.attitude(player,target);
                            var nh=target.countCards('h');
                            if(att>0){
                                if(target.countCards('j',function(card){
                                    var cardj=card.viewAs?{name:card.viewAs}:card;
                                    return get.effect(target,cardj,target,player)<0;
                                })>0) return 3;
                                if(target.getEquip('baiyin')&&target.isDamaged()&&
                                    get.recoverEffect(target,player,player)>0){
                                    if(target.hp==1&&!target.hujia) return 1.6;
                                }
                                if(target.countCards('e',function(card){
                                    if(get.position(card)=='e') return get.value(card,target)<0;
                                })>0) return 1;
                            }
                            var es=target.getCards('e');
                            var noe=(es.length==0||target.hasSkillTag('noe'));
                            var noe2=(es.filter(function(esx){
                                return get.value(esx,target)>0;
                            }).length==0);
                            var noh=(nh==0||target.hasSkillTag('noh'));
                            if(noh&&(noe||noe2)) return 0;
                            if(att<=0&&!target.countCards('he')) return 1.5;
                            return -1.5;
                        },
                    },
                    tag:{
                        loseCard:1,
                        discard:1,
                    },
                },
                group:'qixi_add',
                subSkill:{
                    add:{
                        trigger:{
                            player:"useCard1",
                        },
                        direct:true,
                        filter:function(event,player){
                            return event.card.name=='guohe'&&player.getHistory('useCard',function(evt){
                                if(!evt.isPhaseUsing()) return false;
                                if(evt==event) return false;
                                if(evt.player!=player) return false;
                                if(evt.card.name=='guohe') return true;
                                return false;
                            }).length>=1;
                        },
                        content:function(){
                            'step 0'
                            
                            var num=game.countPlayer(function(current){
                                return !trigger.targets.contains(current)&&lib.filter.targetEnabled2({name:'guohe'},player,current);
                            });
                            var numQ=player.getHistory('useCard',function(evt){
                                if(!evt.isPhaseUsing()) return false;
                                if(evt==trigger) return false;
                                if(evt.player!=player) return false;
                                if(evt.card.name=='guohe') return true;
                                return false;
                            }).length;
                            game.log(num);
                            game.log(numQ);
                            player.chooseTarget('奇袭：是否为'+get.translation(trigger.card)+'增加至多'+get.cnNumber(Math.min(num,numQ))+'目标？',[1,Math.min(num,numQ)],function(card,player,target){
                                var trigger=_status.event.getTrigger();
                                return !trigger.targets.contains(target)&&lib.filter.targetEnabled2({name:'guohe'},player,target);
                            }).set('ai',function(target){
                                var player=_status.event.player;
                                return get.effect(target,{name:'guohe'},player,player);
                            });
                            'step 1'
                            if(result.bool){
                                if(player!=game.me&&!player.isOnline()) game.delayx();
                            }
                            else event.finish();
                            'step 2'
                            var targets=result.targets.sortBySeat();
                            player.logSkill('qixi',targets);
                            trigger.targets.addArray(targets);
                        },
                        sub:true,
                    }
                },
            },

            //贺齐
            lib.skill.qizhou={
                trigger:{
                    player:["phaseBefore","equipEnd","loseEnd"],
                },
                forced:true,
                popup:false,
                derivation:["mashu","yingzi","reduanbing","fenwei"],
                filter:function(event,player){
                    if(player.equiping) return false;
                    var suits=[];
                    var es=player.getCards('e');
                    for(var i=0;i<es.length;i++){
                        suits.add(get.suit(es[i]));
                    }
                    if(player.additionalSkills.qizhou){
                        return player.additionalSkills.qizhou.length!=suits.length;
                    }
                    else{
                        return suits.length>0;
                    }
                },
                content:function(){
                    var suits=[];
                    var es=player.getCards('e');
                    for(var i=0;i<es.length;i++){
                        suits.add(get.suit(es[i]));
                    }
                    player.removeAdditionalSkill('qizhou');
                    switch(suits.length){
                        case 1:player.addAdditionalSkill('qizhou',['mashu']);break;
                        case 2:player.addAdditionalSkill('qizhou',['mashu','yingzi']);break;
                        case 3:player.addAdditionalSkill('qizhou',['mashu','yingzi','reduanbing']);break;
                        case 4:player.addAdditionalSkill('qizhou',['mashu','yingzi','reduanbing','fenwei']);break;
                    }
                },
                ai:{
                    threaten:1.2,
                },
            },

            //陆抗
            lib.translate.rejizhi_info='当你使用锦囊牌时，你可以摸一张牌；若此牌的目标数不小于1，你多摸一张牌。',
            lib.skill.rejizhi={
                inherit:'jizhi',
            },

            //⭐sp赵云
            lib.character.jsp_zhaoyun[3]=['chixin','yicong','suiren'],
            lib.skill.suiren={
                trigger:{
                    player:"phaseZhunbeiBegin",
                },
                skillAnimation:true,
                animationColor:"gray",
                filter:function(event,player){
                    return !player.storage.suiren;
                },
                intro:{
                    content:"limited",
                },
                mark:true,
                direct:true,
                unique:true,
                limited:true,
                content:function(){
                    "step 0"
                    var check=(player.hp==1||(player.hp==2&&player.countCards('h')<=1));
                    player.chooseTarget(get.prompt2('suiren')).set('ai',function(target){
                        if(!_status.event.check) return 0;
                        return get.attitude(_status.event.player,target);
                    }).set('check',check);
                    "step 1"
                    if(result.bool){
                        player.storage.suiren=true;
                        player.awakenSkill('suiren');
                        player.logSkill('suiren',result.targets);
                        player.removeSkill('yicong');
                        player.gainMaxHp();
                        player.recover();
                        result.targets[0].draw(3);
                    }
                },
                init:function(player,skill){
                    player.storage[skill]=false;
                },
            },

            //伏皇后
            lib.character.fuhuanghou[3]=['rezhuikong','oldqiuyuan'],

            //霍峻
            lib.skill.twjieyu={
                audio:2,
                trigger:{
                    player:["phaseJieshuBegin","damageEnd"],
                },
                round:1,
                filter:function(event,player){
                    if(event.name!='phaseJieshu'){
                        var history=player.getHistory('damage');
                        for(var i of history){
                            if(i==event) break;
                            return false;
                        }
                        var all=player.actionHistory;
                        for(var i=all.length-2;i>=0;i--){
                            if(all[i].damage.length) return false;
                            if(all[i].isRound) break;
                        }
                    }
                    return player.countCards('h')>0&&!player.hasCard(function(card){
                        return !lib.filter.cardDiscardable(card,player,'twjieyu');
                    },'h')
                },
                check:function(event,player){
                    var cards=[],names=[];
                    for(var i=0;i<ui.discardPile.childNodes.length;i++){
                        var card=ui.discardPile.childNodes[i];
                        if(get.type(card,false)=='basic'&&!names.contains(card.name)){
                            cards.push(card);
                            names.push(card.name);
                        }
                    }
                    if(!names.contains('shan')||!names.contains('tao')) return false;
                    if(player.countCards('h','shan')<2&&player.countCards('h','tao')<1) return true;
                    return false;
                },
                content:function(){
                    'step 0'
                    player.discard(player.getCards('h'));
                    'step 1'
                    var cards=[],names=[];
                    for(var i=0;i<ui.discardPile.childNodes.length;i++){
                        var card=ui.discardPile.childNodes[i];
                        if(get.type(card,false)=='basic'&&!names.contains(card.name)&&card.name!='du'){
                            cards.push(card);
                            names.push(card.name);
                        }
                    }
                    if(cards.length) player.gain(cards,'gain2');
                },
                group:["twjieyu_roundcount"],
            },

            //刘虞
            lib.character.ol_liuyu[3]=['xinzongzuo','zhige']

            //郭淮
            /*lib.translate.jingce_info='结束阶段，若你X不小于你的体力值，你可以摸X/2（向上取整）张牌，X为你此回合使用的牌的数量。',
            lib.character.re_guohuai[3]=['jingce'],
            lib.skill.jingce={
                trigger:{
                    player:"phaseJieshuBegin",
                },
                frequent:true,
                prompt:function(event,player){
                    var num=Math.ceil(player.getHistory('useCard').length/2);
                    return '是否摸'+get.cnNumber(num)+'张牌';
                },
                filter:function(event,player){
                    return player.getHistory('useCard').length>=player.hp;
                },
                content:function(){
                    var num=Math.ceil(player.getHistory('useCard').length/2);
                    player.draw(num);
                },
                audio:2,
            }*/

            
        },

        precontent:function(){
            
        },
        config:{},
        help:{},
        package:{
            character:{
                character:{
                },
                translate:{
                },
            },
            card:{
                card:{
                },
                translate:{
                },
                list:[],
            },
            skill:{
                skill:{
                },
                translate:{
                },
            },
            intro:"",
            author:"枭雄之姿",
            diskURL:"",
            forumURL:"",
            version:"1.0",
        },
        files:{
            "character":[],"card":[],"skill":[]
        }
    }
})