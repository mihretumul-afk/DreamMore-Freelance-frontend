import React from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  PhoneCall,
  PhoneIncoming,
  Monitor,
  Volume2,
} from 'lucide-react';
import Avatar from '../marketplace/Avatar';
import Button from '../ui/Button';

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function LiveVideoCallModal({
  callState,
  partner,
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  acceptCall,
  rejectCall,
  endCall,
  toggleMic,
  toggleCamera,
  toggleScreenShare,
}) {
  if (callState === 'idle' || !partner) return null;

  // 1. INCOMING CALL MODAL
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center text-white shadow-2xl space-y-6">
          <div className="relative inline-block">
            <Avatar name={partner.name} src={partner.avatar} size="xl" className="mx-auto ring-4 ring-brand-500/30" />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white animate-bounce">
              <PhoneIncoming className="h-4 w-4" />
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold">{partner.name}</h3>
            <p className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Incoming Live Video Call...
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2">
            <button
              onClick={rejectCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              title="Decline Call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <button
              onClick={acceptCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 animate-pulse"
              title="Accept Video Call"
            >
              <PhoneCall className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. OUTGOING / RINGING CALL MODAL
  if (callState === 'calling') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center text-white shadow-2xl space-y-6">
          <div className="relative inline-block">
            <Avatar name={partner.name} src={partner.avatar} size="xl" className="mx-auto ring-4 ring-brand-500/30" />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white">
              <Volume2 className="h-4 w-4 animate-pulse" />
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold">{partner.name}</h3>
            <p className="text-sm text-slate-400 mt-1">Calling... Waiting for partner to join</p>
          </div>

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => endCall(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              title="End Call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. LIVE CONNECTED VIDEO CALL MODAL
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 md:p-6 animate-fade-in">
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
        {/* Header Bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 text-white">
          <div className="flex items-center gap-3">
            <Avatar name={partner.name} src={partner.avatar} size="sm" />
            <div>
              <h4 className="text-sm font-bold leading-none">{partner.name}</h4>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Video
              </span>
            </div>
          </div>

          <div className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-mono tracking-wide text-slate-200 border border-slate-700">
            {formatTimer(callDuration)}
          </div>
        </div>

        {/* Video Containers Area */}
        <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center">
          {/* Main View: Partner Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />

          {/* Remote Video Fallback if video track muted/missing */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 pointer-events-none opacity-0 [.no-remote-video_&]:opacity-100 transition-opacity">
            <Avatar name={partner.name} src={partner.avatar} size="xl" className="ring-4 ring-slate-800" />
            <p className="mt-3 text-sm text-slate-400">{partner.name}</p>
          </div>

          {/* PIP Sub View: User Local Video */}
          <div className="absolute bottom-20 right-4 z-20 h-36 w-28 md:h-48 md:w-36 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-950 shadow-2xl transition-all hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}
            />
            {isCameraOff && (
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-slate-400">
                <VideoOff className="h-6 w-6 mb-1 text-slate-500" />
                <span className="text-[10px]">Camera Off</span>
              </div>
            )}
          </div>
        </div>

        {/* Control Bar */}
        <div className="z-20 flex items-center justify-center gap-4 bg-slate-950 p-4 border-t border-slate-800/80">
          <button
            onClick={toggleMic}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
              isMicMuted ? 'bg-rose-600/90 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
              isCameraOff ? 'bg-rose-600/90 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
              isScreenSharing ? 'bg-brand-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
          >
            <Monitor className="h-5 w-5" />
          </button>

          <button
            onClick={() => endCall(true)}
            className="flex h-12 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            title="End Video Call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
