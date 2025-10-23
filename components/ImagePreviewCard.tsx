import React from 'react';
import { ImageJob } from '../App';
import { FaceBox } from '../services/imageService';

interface ImagePreviewCardProps {
    job: ImageJob;
    onFaceSelect: (jobId: string, faceIndex: number) => void;
}

// FIX: Pass the entire job object to have access to all its properties.
const getStatusMessage = (job: ImageJob): string | null => {
    switch (job.status) {
        case 'detecting':
            return 'Detecting faces...';
        case 'selection_needed':
            return `Select a face (${job.faces.length} found)`;
        case 'ready':
             if (job.faces.length > 1) return 'Face selected';
             if (job.faces.length === 1) return 'Face detected & cropped';
             return 'No face found, using original';
        case 'error':
            return job.error || 'An error occurred';
        default:
            return null;
    }
};

const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({ job, onFaceSelect }) => {

    const statusMessage = getStatusMessage(job);
    const statusColorClass = job.status === 'selection_needed' ? 'text-yellow-400' 
                             : job.status === 'error' ? 'text-red-400' 
                             : 'text-gray-400';

    return (
        <div className="relative aspect-square flex flex-col">
            <div className="relative w-full h-full rounded-md shadow-lg overflow-hidden group">
                <img 
                    src={job.displayUrl} 
                    alt={job.file.name}
                    className="object-cover w-full h-full" 
                />
                
                {job.status === 'detecting' && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div>
                    </div>
                )}
                
                {job.status === 'selection_needed' && (
                    <div className="absolute inset-0 bg-black/50">
                        {job.faces.map((face, index) => (
                            <button
                                key={index}
                                onClick={() => onFaceSelect(job.id, index)}
                                className="absolute block border-2 border-white/70 hover:border-blue-500 hover:bg-blue-500/30 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                                style={{
                                    left: `${face.x * 100}%`,
                                    top: `${face.y * 100}%`,
                                    width: `${face.width * 100}%`,
                                    height: `${face.height * 100}%`,
                                }}
                                aria-label={`Select face ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                 {job.selectedFaceIndex !== null && job.faces.length > 1 && (
                     <div
                        className="absolute block border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                        style={{
                            left: `${job.faces[job.selectedFaceIndex].x * 100}%`,
                            top: `${job.faces[job.selectedFaceIndex].y * 100}%`,
                            width: `${job.faces[job.selectedFaceIndex].width * 100}%`,
                            height: `${job.faces[job.selectedFaceIndex].height * 100}%`,
                        }}
                    />
                )}
            </div>
             {statusMessage && (
                <div className={`text-center text-xs mt-2 ${statusColorClass}`}>
                    {statusMessage}
                </div>
            )}
        </div>
    );
};

export default ImagePreviewCard;
