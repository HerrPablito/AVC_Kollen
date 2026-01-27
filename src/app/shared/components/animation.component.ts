import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stick-scene" aria-hidden="true">
  <svg class="stick-svg" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMid meet">
    <!-- papperskorg -->
    <g id="bin" transform="translate(320,95)">
      <rect x="0" y="20" width="55" height="75" rx="6" fill="none" class="stroke"/>
      <line x1="-6" y1="20" x2="61" y2="20" class="stroke"/>
      <line x1="8" y1="32" x2="8" y2="88" class="stroke thin"/>
      <line x1="20" y1="32" x2="20" y2="88" class="stroke thin"/>
      <line x1="32" y1="32" x2="32" y2="88" class="stroke thin"/>
      <line x1="44" y1="32" x2="44" y2="88" class="stroke thin"/>
    </g>

    <!-- skräp på marken -->
    <circle id="trash" cx="820" cy="185" r="5" class="stroke" />

    <!-- streckgubbe (animeras med transform) -->
<g id="guy" class="guy" transform="translate(1300,0)">
  <!-- huvud -->
  <circle cx="0" cy="70" r="12" class="stroke"/>

  <!-- kropp -->
  <line x1="0" y1="82" x2="0" y2="125" class="stroke"/>

  <!-- ARMAR (2 segment: överarm + underarm) -->
  <g class="arm arm-l" transform="translate(0,95)">
    <g class="upper">
      <line x1="0" y1="0" x2="-22" y2="12" class="stroke"/>
      <g class="lower" transform="translate(-22,12)">
        <line x1="0" y1="0" x2="-18" y2="14" class="stroke"/>
      </g>
    </g>
  </g>

  <g class="arm arm-r" transform="translate(0,95)">
    <g class="upper">
      <line x1="0" y1="0" x2="22" y2="12" class="stroke"/>
      <g class="lower" transform="translate(22,12)">
        <line x1="0" y1="0" x2="18" y2="14" class="stroke"/>
      </g>
    </g>
  </g>

  <!-- BEN (2 segment: lår + underben) -->
  <g class="leg leg-l" transform="translate(0,125)">
    <g class="thigh">
      <line x1="0" y1="0" x2="-14" y2="28" class="stroke"/>
      <g class="shin" transform="translate(-14,28)">
        <line x1="0" y1="0" x2="-6" y2="30" class="stroke"/>
      </g>
    </g>
  </g>

  <g class="leg leg-r" transform="translate(0,125)">
    <g class="thigh">
      <line x1="0" y1="0" x2="14" y2="28" class="stroke"/>
      <g class="shin" transform="translate(14,28)">
        <line x1="0" y1="0" x2="6" y2="30" class="stroke"/>
      </g>
    </g>
  </g>

  <!-- skräp i hand (syns efter uppplock) -->
  <circle class="hand-trash" cx="40" cy="125" r="4" />
</g>



    <!-- marklinje (valfri, kan tas bort) -->
    <line x1="0" y1="185" x2="1200" y2="185" class="stroke ground"/>
  </svg>
</div>

    <div class="animation-container">
       <!-- Exempel: -->
       <!-- <div class="my-animation"></div> -->
    </div>
  `,
  styles: [`
    :host {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

/* Lägg scenen ovanpå din hero/sektion */
.stick-scene{
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2; /* höj/sänk vid behov */
}

.stick-svg{
  width: 100%;
  height: 260px;          /* justera höjd */
  position: absolute;
  left: 0;
  bottom: 0;              /* ligger “på golvet” */
  overflow: visible;
}

/* Vit “streck” stil */
.stroke{
  stroke: rgba(255,255,255,0.95);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
.stroke.thin{ stroke-width: 2.5; }
.ground{ opacity: 0.15; }

/* --- Tidslinje (hela scenen tar 12s och loopar) --- */
/* --- Tidslinje (hela scenen tar 12s och loopar) --- */
.guy{
  animation: move 12s linear infinite;
  transform-origin: 0 0;
}

/* 
   VIKTIGT: Behållarna (.arm-l, .leg-r etc) positionerar bara leden.
   Vi animerar .upper/.thigh för hela lemmens pendling
   och .lower/.shin för böjning i armbåge/knä.
*/

/* Skräp på marken försvinner när det plockas upp */
#trash{
  animation: trashOnGround 12s linear infinite;
}

/* Skräp i handen: syns efter uppplock tills släng */
.hand-trash{
  fill: rgba(255,255,255,0.95);
  opacity: 0;
  animation: trashInHand 12s linear infinite;
}

/* Se till att SVG-transform beter sig stabilt */
.stick-svg *{
  transform-box: fill-box;
  transform-origin: 0 0;
}

/* --- GÅNG-CYKEL & HANDLINGS-SEKVENSER --- */

/* 
  Walk cycle note:
  Vi använder enkla sinus-liknande rörelser för gången.
  Pauserna är vid 35-45% (Plocka) och 70-80% (Slänga).
*/

/* VÄNSTER ARM (Bortre) */
.arm-l .upper { animation: armL_upper 12s linear infinite; }
.arm-l .lower { animation: armL_lower 12s linear infinite; }

/* HÖGER ARM (Främre) */
.arm-r .upper { animation: armR_upper 12s linear infinite; }
.arm-r .lower { animation: armR_lower 12s linear infinite; }

/* VÄNSTER BEN (Bortre) */
.leg-l .thigh { animation: legL_thigh 12s linear infinite; }
.leg-l .shin  { animation: legL_shin  12s linear infinite; }

/* HÖGER BEN (Främre) */
.leg-r .thigh { animation: legR_thigh 12s linear infinite; }
.leg-r .shin  { animation: legR_shin  12s linear infinite; }


/* --- KEYFRAMES --- */

/* 
  WALK CYCLE (ca 1s per steg):
  Vi simulerar gång genom att pendla fram/tillbaka.
  Vi "fryser" rörelsen (eller sätter en specifik pose) under pauserna.
*/

/* -- ARMAR -- */
@keyframes armL_upper {
  /* Gå (Pendla mot höger ben) */
  0%, 10%, 20%, 30% { transform: rotate(20deg); }
  5%, 15%, 25%      { transform: rotate(-20deg); }
  
  /* Plocka (35-45%) - Sträck ner */
  35% { transform: rotate(45deg); }
  45% { transform: rotate(45deg); }
  
  /* Gå igen */
  55% { transform: rotate(20deg); }
  60% { transform: rotate(-20deg); }
  65% { transform: rotate(20deg); }

  /* Slänga (70-80%) - Sträck upp/fram */
  70% { transform: rotate(-40deg); } /* Ladda */
  75% { transform: rotate(-60deg); } /* Kasta */
  80% { transform: rotate(-10deg); } /* Klar */

  /* Gå ut */
  90%, 100% { transform: rotate(20deg); }
  95%       { transform: rotate(-20deg); }
}

@keyframes armL_lower {
  /* Gå - lätt böjd */
  0%, 30% { transform: rotate(10deg); }
  
  /* Plocka */
  35%, 45% { transform: rotate(10deg); } 
  
  /* Slänga */
  70% { transform: rotate(80deg); } /* Böj armbåge helt */
  75% { transform: rotate(10deg); } /* Sträck ut */
  80% { transform: rotate(10deg); }

  /* Gå */
  55%, 65%, 90%, 100% { transform: rotate(10deg); }
}

@keyframes armR_upper {
  /* Gå (Motsatt armL) */
  0%, 10%, 20%, 30% { transform: rotate(-20deg); }
  5%, 15%, 25%      { transform: rotate(20deg); }

  /* Plocka - Häng still */
  35%, 45% { transform: rotate(-10deg); }

  /* Gå */
  55% { transform: rotate(-20deg); }
  60% { transform: rotate(20deg); }
  65% { transform: rotate(-20deg); }

  /* Slänga */
  70%, 80% { transform: rotate(-10deg); }

  /* Gå */
  90%, 100% { transform: rotate(-20deg); }
  95%       { transform: rotate(20deg); }
}

@keyframes armR_lower {
  0%, 100% { transform: rotate(15deg); } /* Statisk lätt böj */
}


/* -- BEN -- */
@keyframes legL_thigh {
  /* Gå: Fram(25deg) -> Bak(-25deg) */
  0%, 10%, 20%, 30% { transform: rotate(-25deg); }
  5%, 15%, 25%      { transform: rotate(25deg); }

  /* Plocka - Stå still (lite isär) */
  35%, 45% { transform: rotate(5deg); }

  /* Gå */
  55% { transform: rotate(-25deg); }
  60% { transform: rotate(25deg); }
  65% { transform: rotate(-25deg); }

  /* Slänga - Stå still */
  70%, 80% { transform: rotate(5deg); }

  /* Gå */
  90%, 100% { transform: rotate(-25deg); }
  95%       { transform: rotate(25deg); }
}

@keyframes legL_shin {
  /* Gå: När benet är bak, rakt. När fram, böj knä lite. */
  0%, 10%, 20%, 30% { transform: rotate(10deg); }
  5%, 15%, 25%      { transform: rotate(10deg); }

  /* Stilla */
  35%, 45%, 70%, 80% { transform: rotate(0deg); }

  55%, 65%, 90%, 100% { transform: rotate(10deg); }
}

@keyframes legR_thigh {
  /* Gå: Motsatt ben L */
  0%, 10%, 20%, 30% { transform: rotate(25deg); }
  5%, 15%, 25%      { transform: rotate(-25deg); }

  /* Plocka - Stå still */
  35%, 45% { transform: rotate(-5deg); }

  /* Gå */
  55% { transform: rotate(25deg); }
  60% { transform: rotate(-25deg); }
  65% { transform: rotate(25deg); }

  /* Slänga */
  70%, 80% { transform: rotate(-5deg); }

  /* Gå */
  90%, 100% { transform: rotate(25deg); }
  95%       { transform: rotate(-25deg); }
}

@keyframes legR_shin {
  /* Enkel knäböj vid behov */
  0%, 5%, 10%, 15%, 20%, 25%, 30% { transform: rotate(15deg); }
  
  35%, 45%, 70%, 80% { transform: rotate(0deg); }

  55%, 60%, 65%, 90%, 95%, 100% { transform: rotate(15deg); }
}

@keyframes trashInHand{
  0%, 44% { opacity: 0; }
  45%, 75% { opacity: 1; }
  76%, 100% { opacity: 0; }
}

/* Huvudrörelse: Gå in -> Stanna vid skräp -> Gå -> Stanna vid korg -> Gå ut */
@keyframes move {
  0%   { transform: translate(1300px, 0); }
  35%  { transform: translate(840px, 0); }  /* Vid skräpet */
  45%  { transform: translate(840px, 0); }  /* Plockar */
  70%  { transform: translate(400px, 0); }  /* Vid korgen */
  80%  { transform: translate(400px, 0); }  /* Slänger */
  100% { transform: translate(-200px, 0); } /* Går ut */
}

  `]
})
export class AnimationComponent { }
