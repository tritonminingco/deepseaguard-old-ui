import {useEffect, useState, useRef} from 'react';
import Hls from 'hls.js';
import "../styles/LiveFeed.css"; 
import { ClipLoader } from "react-spinners";
import { FaCamera } from 'react-icons/fa';
import { Dropdown } from 'primereact/dropdown';
import SquareButton from './SquareButton';
import { FaPause } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { FaVolumeUp } from 'react-icons/fa';
import { MdFullscreen } from 'react-icons/md';
export default function LiveFeed({ streamUrl}) {
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [timestamp, setTimestamp] = useState(new Date());
    const [selectedCity, setSelectedCity] = useState("Main Camera");

    useEffect(() => {
        const timer = setInterval(() => setTimestamp(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setIsOffline(false);

        if (!streamUrl) return;
        const video = videoRef.current;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) setIsOffline(true);
            });
            return () => hls.destroy();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
        }        
    }, [streamUrl]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };
    const cities = [
        { name: 'Main Camera', code: 'MC' },
        { name: 'Secondary Camera', code: 'SC' },
        { name: 'Backup Camera', code: 'BC' }
    ];
    return (
        <div className='mx-8'>
            <div className='bg-gray-900 round-lg shadow-lg p-3 relative overflow-hidden border'>
                <div className='flex justify-between'>
                    <div className='padding-h3 flex'>
                        <span className='text-red mr-2'><FaCamera /></span>
                        <h3 className='text-lg font-semibold text-white mb-2'>
                            Live Camera Feed
                        </h3>
                        { !isOffline && (
                            <div className='live-status'>
                                LIVE
                            </div>
                        )}           
                        <div>
                            <Dropdown options={cities} optionLabel="name" onChange={(e) => setSelectedCity(e.value)} value={selectedCity}
                            placeholder="Main Camera" className="w-fits rounded-sm border" />
                        </div>
                    </div>
                    <div className='flex padding-buttons'>
                        <SquareButton label={<FaPause/>} onClick={() => {
                            setIsLoading(true);
                            setIsOffline(false);
                            videoRef.current.load();
                        }} />
                        <SquareButton label={<FiRefreshCw/>} onClick={() => {
                            setIsLoading(true);
                            setIsOffline(false);
                            videoRef.current.load();
                        }} />
                        <SquareButton label={<FaVolumeUp/>} onClick={() => {
                            setIsLoading(true);
                            setIsOffline(false);
                            videoRef.current.load();
                        }} />
                        <SquareButton label={<MdFullscreen/>} onClick={toggleFullscreen} />
                    </div>                                        
                </div>
                <div className='relative padding-video'>
                    <video
                        ref={videoRef}
                        className="w-full h-auto rounded-lg shadow-lg"
                        autoPlay
                        muted
                        playsInline
                        onError={() => setIsOffline(true)}
                        onLoadedData={() => setIsLoading(false)}
                    />
                    <div className="absolute top-4 left-4  text-white text-xs p-2 rounded space-y-1 block">
                        <span className='bg-black-60'>⚓ DEPTH: 2847m</span>
                        <span className='bg-black-60'>🌡 TEMP: 4.2°C</span>
                        <span className='bg-black-60'>🧭 HDG: 127°</span>
                        <span className='bg-black-60'>ALT: 12.5m</span>
                    </div>

                    <div className="absolute top-4 right-4  text-white text-xs p-2 rounded space-y-1 block">
                        <span className='bg-black-60 text-left'>📶 85%</span>
                        <span className='bg-black-60 text-left'>🔋 78%</span>
                        <span className='bg-black-60 text-left'>PRESS: 284.7 bar</span>
                        <span className='bg-black-60 text-left'>HD</span>
                    </div>

                    <div className='absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded'>
                        {isOffline ? 'Stream Offline' : `Live - ${timestamp.toLocaleTimeString()}`}    
                    </div>
                    {isLoading && !isOffline && (
                        <ClipLoader />
                    )}
                    {isOffline && (
                        <div className={`absolute inset-0 bg-black/70 flex items-center justify-center text-white text-lg font-bold transition-opacity duration-500 ${
                            isOffline ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}>
                            <span className="offline-pulse flex items-center gap-2">
                                <span className="offline-dot"></span>
                                Offline
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

}