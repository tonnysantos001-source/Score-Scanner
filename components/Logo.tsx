import React from 'react';
import { Shield, Search } from 'lucide-react';

export default function Logo({ size = "large" }: { size?: "small" | "medium" | "large" }) {
    const isLarge = size === "large";
    const isSmall = size === "small";

    const shieldSize = isLarge ? 64 : isSmall ? 24 : 40;
    const searchSize = isLarge ? 32 : isSmall ? 12 : 20;

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative flex items-center justify-center">
                {/* Shield Background */}
                <Shield
                    size={shieldSize}
                    className="text-white fill-blue-600/20 stroke-[1.5]"
                    style={{
                        filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))"
                    }}
                />

                {/* Magnifying Glass Overlay */}
                <div className="absolute -right-1 -bottom-1 bg-gray-900 rounded-full p-1 border-2 border-gray-900">
                    <Search
                        size={searchSize}
                        className="text-purple-400 stroke-[2.5]"
                    />
                </div>
            </div>

            {/* Text Logo */}
            {isLarge && (
                <div className="text-center mt-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-0 leading-none">
                        Verify<span className="text-blue-500">Ads</span>
                    </h1>
                    <p className="text-[10px] text-gray-400 font-medium tracking-[0.3em] uppercase mt-1">
                        Score Scanner
                    </p>
                </div>
            )}
        </div>
    );
}
