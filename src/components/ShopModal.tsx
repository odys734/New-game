import React, { useState } from 'react';
import { ShoppingBag, Check, Lock, Sparkles, Trophy, X, Video, Zap, Droplet, Palette, Sparkle } from 'lucide-react';
import { AppThemeMode, PlayerProfile, ShopItem } from '../types/game';
import { INITIAL_SHOP_ITEMS } from '../data/shopAndAchievements';

interface ShopModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: Partial<PlayerProfile>) => void;
  onWatchBonusCoinsAd?: () => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  profile,
  onUpdateProfile,
  onWatchBonusCoinsAd,
  onClose,
}) => {
  const [items, setItems] = useState<ShopItem[]>(INITIAL_SHOP_ITEMS);
  const [activeTab, setActiveTab] = useState<'trail' | 'skin' | 'theme' | 'effect' | 'ink_capacity'>('trail');

  const ownedItemsSet = new Set(
    profile.ownedItems || [
      'trail_default',
      'trail_neon',
      'skin_classic',
      'neon_dark',
      'effect_spark',
    ]
  );

  const filteredItems = items.filter((i) => i.category === activeTab);

  const isItemOwned = (item: ShopItem) => {
    return item.price === 0 || ownedItemsSet.has(item.id);
  };

  const getInkCapacityLevel = (id: string): number => {
    switch (id) {
      case 'ink_cap_1': return 1;
      case 'ink_cap_2': return 2;
      case 'ink_cap_3': return 3;
      case 'ink_cap_4': return 4;
      default: return 0;
    }
  };

  const handleBuyOrEquip = (item: ShopItem) => {
    const owned = isItemOwned(item);

    if (!owned) {
      if (profile.coins < item.price) {
        alert(`Need ${item.price - profile.coins} more coins! Play levels or watch bonus ads to earn coins.`);
        return;
      }

      // Purchase item
      const updatedCoins = profile.coins - item.price;
      const updatedOwned = Array.from(new Set([...(profile.ownedItems || []), item.id]));

      let updates: Partial<PlayerProfile> = {
        coins: updatedCoins,
        ownedItems: updatedOwned,
      };

      if (item.category === 'trail') {
        updates.selectedTrail = item.id;
      } else if (item.category === 'theme') {
        updates.selectedTheme = item.id as AppThemeMode;
      } else if (item.category === 'skin') {
        updates.selectedSkin = item.id;
      } else if (item.category === 'effect') {
        updates.selectedEffect = item.id;
      } else if (item.category === 'ink_capacity') {
        const level = getInkCapacityLevel(item.id);
        updates.inkCapacityLevel = Math.max(profile.inkCapacityLevel || 0, level);
      }

      onUpdateProfile(updates);
    } else {
      // Equip item
      let updates: Partial<PlayerProfile> = {};

      if (item.category === 'trail') {
        updates.selectedTrail = item.id;
      } else if (item.category === 'theme') {
        updates.selectedTheme = item.id as AppThemeMode;
      } else if (item.category === 'skin') {
        updates.selectedSkin = item.id;
      } else if (item.category === 'effect') {
        updates.selectedEffect = item.id;
      } else if (item.category === 'ink_capacity') {
        const level = getInkCapacityLevel(item.id);
        updates.inkCapacityLevel = level;
      }

      onUpdateProfile(updates);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 md:p-6 shadow-2xl relative text-slate-100 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-100 tracking-wide">Premium Cosmetics & Ink Shop</h3>
              <p className="text-xs text-slate-400">100% Fair Visual Customizations & Ink Capacity Upgrades</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/40 px-3.5 py-1.5 rounded-2xl text-xs font-black text-amber-400 shadow-sm">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{profile.coins} Coins</span>
            </div>

            {onWatchBonusCoinsAd && (
              <button
                onClick={onWatchBonusCoinsAd}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                title="Watch ad for +100 Coins"
              >
                <Video className="w-3.5 h-3.5" />
                <span>+100 Coins</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex gap-1.5 mb-4 border-b border-slate-800 pb-3 overflow-x-auto shrink-0 no-scrollbar">
          {(
            [
              { id: 'trail', label: '✒️ Ink', icon: Droplet },
              { id: 'skin', label: '💧 Glass', icon: Sparkles },
              { id: 'theme', label: '🎨 Themes', icon: Palette },
              { id: 'effect', label: '✨ Effects', icon: Sparkle },
              { id: 'ink_capacity', label: '⚡ Buy Ink Boost', icon: Zap },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-300'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto pr-1 flex-1">
          {filteredItems.map((item) => {
            const owned = isItemOwned(item);
            const canAfford = profile.coins >= item.price;

            let isEquipped = false;
            if (item.category === 'trail') {
              isEquipped = profile.selectedTrail === item.id || (profile.selectedTrail === item.previewColor);
            } else if (item.category === 'theme') {
              isEquipped = profile.selectedTheme === item.id;
            } else if (item.category === 'skin') {
              isEquipped = profile.selectedSkin === item.id;
            } else if (item.category === 'effect') {
              isEquipped = (profile.selectedEffect ?? 'effect_spark') === item.id;
            } else if (item.category === 'ink_capacity') {
              const targetLevel = getInkCapacityLevel(item.id);
              isEquipped = (profile.inkCapacityLevel ?? 0) >= targetLevel;
            }

            return (
              <div
                key={item.id}
                className={`bg-slate-950/90 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  isEquipped
                    ? 'border-cyan-400 ring-2 ring-cyan-400/30 bg-slate-950 shadow-lg shadow-cyan-950/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full border border-white/40 shadow-md shrink-0 flex items-center justify-center text-[10px]"
                        style={{
                          backgroundColor: item.previewColor,
                          boxShadow: `0 0 10px ${item.previewColor}80`,
                        }}
                      />
                      <h4 className="font-extrabold text-xs text-slate-100">{item.name}</h4>
                    </div>

                    {isEquipped && (
                      <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{item.description}</p>
                </div>

                <div>
                  <button
                    onClick={() => handleBuyOrEquip(item)}
                    disabled={isEquipped || (!owned && !canAfford)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isEquipped
                        ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                        : owned
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-98'
                        : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800 opacity-80'
                    }`}
                  >
                    {isEquipped ? (
                      <span>Equipped & Active</span>
                    ) : owned ? (
                      <span>Equip Cosmetic</span>
                    ) : canAfford ? (
                      <>
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Unlock ({item.price} Coins)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Need {item.price} Coins ({item.price - profile.coins} missing)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


