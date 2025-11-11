"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (t: string) => void;
  onClose: () => void;
}

export default function QRScanner({
  onScan: hit,
  onClose: bye,
}: QRScannerProps) {
  const qr = useRef<Html5Qrcode | null>(null);
  const [ld, setLd] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const q = new Html5Qrcode("qr-reader");
    qr.current = q;

    const cfg = {
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      fps: 10,
    };

    q.start(
      { facingMode: "environment" },
      cfg,
      (t) => {
        setOk(true);
        hit(t);
        q.stop().catch((e) => console.error("stop fail:", e));
      },
      () => {}
    ).then(() => setLd(false));

    return () => {
      if (qr.current?.isScanning) {
        qr.current.stop().then(() => qr.current?.clear());
      }
    };
  }, [hit]);

  const kill = () => {
    if (qr.current?.isScanning) {
      qr.current.stop().then(() => {
        qr.current?.clear();
        bye();
      });
    } else bye();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 max-w-md w-full shadow-lg border border-border-gray">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-fg">QR code scanning</h2>
            <p className="text-sm text-sec font-medium">
              Point it at a QR code to scan
            </p>
          </div>
          <button
            onClick={kill}
            className="text-sec hover:text-fg text-3xl font-bold transition-colors w-12 h-12 flex items-center justify-center hover:bg-cream"
          >
            X
          </button>
        </div>

        {ld && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block animate-spin h-16 w-16 border-4 border-pri border-t-transparent mb-4"></div>
            <p className="text-fg font-medium">Starting cam...</p>
          </div>
        )}

        <div
          id="qr-reader"
          className="w-full overflow-hidden shadow-md border border-border-gray"
        ></div>

        {!ld && !ok && (
          <div className="mt-6 space-y-3">
            <div className="bg-cream p-4 text-center border-l-4 border-pri">
              <p className="text-sm text-fg font-bold mb-2">
                point the cam plss
              </p>
              <p className="text-xs text-sec font-medium">
                make sure the qr code is clear
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-sec">
              <div className="w-2 h-2 bg-accent animate-pulse"></div>
              <span className="font-medium">Scanning...</span>
            </div>
          </div>
        )}

        {ok && (
          <div className="mt-6 bg-pri p-4 text-center">
            <p className="text-white font-bold">QR code detected...</p>
          </div>
        )}
      </div>
    </div>
  );
}
