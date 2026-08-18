import React from "react";

export default function Stander({ size = "md" }) {
  return (
    <div className={`standerScene stander-${size}`} aria-hidden="true">
      <div className="stander" role="img" aria-label="Stander, the StandX mascot">
        <div className="standerHighlight" />
        <div className="standerStalk" />
        <div className="standerLeaf" />
        <div className="standerArm standerArmL"><span /></div>
        <div className="standerArm standerArmR"><span /></div>
        <div className="standerEye">
          <span className="standerIris" />
          <i className="standerGlint a" />
          <i className="standerGlint b" />
        </div>
        <div className="standerMouth" />
        <div className="standerLeg standerLegL"><i /></div>
        <div className="standerLeg standerLegR"><i /></div>
      </div>
    </div>
  );
}
