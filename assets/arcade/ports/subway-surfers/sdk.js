const noAds=()=>{};
window.PokiSDK={init:()=>Promise.resolve(),setDebug:noAds,isAdBlocked:()=>true,commercialBreak:()=>Promise.resolve(),rewardedBreak:()=>Promise.resolve(false)};
for(const name of ['customEvent','destroyAd','displayAd','gameInteractive','gameLoadingFinished','gameLoadingStart','gameLoadingProgress','gameplayStart','gameplayStop','happyTime','roundEnd','roundStart','setPlayerAge','togglePlayerAdvertisingConsent'])PokiSDK[name]=noAds;
window.initPokiBridge=name=>{unityGame.SendMessage(name,'adblock');window.commercialBreak=()=>unityGame.SendMessage(name,'commercialBreakCompleted');window.rewardedBreak=()=>unityGame.SendMessage(name,'rewardedBreakCompleted','false');};
