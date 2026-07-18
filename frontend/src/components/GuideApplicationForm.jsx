import { useEffect, useRef, useState } from 'react';
import {
    Camera,
    CheckCircle,
    FileText,
    Loader2,
    MapPin,
    RefreshCw,
    Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const createInitialGuideAddress = (user) => ({
    regionCode: user?.guideAddress?.regionCode || '',
    regionName: user?.guideAddress?.regionName || '',
    provinceCode: user?.guideAddress?.provinceCode || '',
    provinceName: user?.guideAddress?.provinceName || '',
    cityMunicipalityCode: user?.guideAddress?.cityMunicipalityCode || '',
    cityMunicipalityName: user?.guideAddress?.cityMunicipalityName || '',
    barangayCode: user?.guideAddress?.barangayCode || '',
    barangayName: user?.guideAddress?.barangayName || '',
    streetAddress: user?.guideAddress?.streetAddress || '',
});

const createInitialFormData = (user) => ({
    accreditationFile: null,
    accreditationFileName: '',
    guideAddress: createInitialGuideAddress(user),
    livenessSelfie: null,
    livenessCapturedAt: '',
});

const readFileAsDataUrl = (file) => (
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    })
);

const GuideApplicationForm = ({
    user,
    submitting = false,
    onSubmit,
    onCancel,
    submitLabel = 'Submit Application',
    submitButtonClassName = 'bg-terracotta-600 hover:bg-terracotta-700 text-white',
}) => {
    const [formData, setFormData] = useState(() => createInitialFormData(user));
    const [regionOptions, setRegionOptions] = useState([]);
    const [provinceOptions, setProvinceOptions] = useState([]);
    const [cityMunicipalityOptions, setCityMunicipalityOptions] = useState([]);
    const [barangayOptions, setBarangayOptions] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCitiesMunicipalities, setLoadingCitiesMunicipalities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const stopCameraStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    const loadRegions = async ({ silent = false } = {}) => {
        setLoadingRegions(true);
        try {
            const response = await api.get('/users/psgc/regions');
            setRegionOptions(response.data || []);
            return response.data || [];
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || 'Failed to load PSGC regions');
            }
            return [];
        } finally {
            setLoadingRegions(false);
        }
    };

    const loadProvinces = async (regionCode, { silent = false } = {}) => {
        if (!regionCode) {
            setProvinceOptions([]);
            return [];
        }

        setLoadingProvinces(true);
        try {
            const response = await api.get(`/users/psgc/provinces?regionCode=${regionCode}`);
            setProvinceOptions(response.data || []);
            return response.data || [];
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || 'Failed to load provinces');
            }
            setProvinceOptions([]);
            return [];
        } finally {
            setLoadingProvinces(false);
        }
    };

    const loadCitiesMunicipalities = async ({ regionCode, provinceCode }, { silent = false } = {}) => {
        if (!regionCode && !provinceCode) {
            setCityMunicipalityOptions([]);
            return [];
        }

        setLoadingCitiesMunicipalities(true);
        try {
            const query = provinceCode
                ? `provinceCode=${provinceCode}`
                : `regionCode=${regionCode}`;
            const response = await api.get(`/users/psgc/cities-municipalities?${query}`);
            setCityMunicipalityOptions(response.data || []);
            return response.data || [];
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || 'Failed to load cities and municipalities');
            }
            setCityMunicipalityOptions([]);
            return [];
        } finally {
            setLoadingCitiesMunicipalities(false);
        }
    };

    const loadBarangays = async (cityMunicipalityCode, { silent = false } = {}) => {
        if (!cityMunicipalityCode) {
            setBarangayOptions([]);
            return [];
        }

        setLoadingBarangays(true);
        try {
            const response = await api.get(`/users/psgc/barangays?cityMunicipalityCode=${cityMunicipalityCode}`);
            setBarangayOptions(response.data || []);
            return response.data || [];
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || 'Failed to load barangays');
            }
            setBarangayOptions([]);
            return [];
        } finally {
            setLoadingBarangays(false);
        }
    };

    useEffect(() => {
        let ignore = false;

        const hydrateAddressSelections = async () => {
            const initialFormData = createInitialFormData(user);
            if (!ignore) {
                setFormData(initialFormData);
            }

            await loadRegions({ silent: true });

            if (!initialFormData.guideAddress.regionCode) {
                if (!ignore) {
                    setProvinceOptions([]);
                    setCityMunicipalityOptions([]);
                    setBarangayOptions([]);
                }
                return;
            }

            const provinces = await loadProvinces(initialFormData.guideAddress.regionCode, { silent: true });

            if (ignore) {
                return;
            }

            if (provinces.length > 0 && initialFormData.guideAddress.provinceCode) {
                await loadCitiesMunicipalities({ provinceCode: initialFormData.guideAddress.provinceCode }, { silent: true });
            } else {
                await loadCitiesMunicipalities({ regionCode: initialFormData.guideAddress.regionCode }, { silent: true });
            }

            if (initialFormData.guideAddress.cityMunicipalityCode) {
                await loadBarangays(initialFormData.guideAddress.cityMunicipalityCode, { silent: true });
            }
        };

        hydrateAddressSelections();

        return () => {
            ignore = true;
            stopCameraStream();
        };
    }, [user]);

    const handleAccreditationFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) {
            toast.error('File size must be less than 1MB');
            return;
        }

        try {
            const fileDataUrl = await readFileAsDataUrl(file);
            setFormData((previousFormData) => ({
                ...previousFormData,
                accreditationFile: fileDataUrl,
                accreditationFileName: file.name,
            }));
        } catch {
            toast.error('Failed to read accreditation file');
        }
    };

    const handleAddressValueChange = (field, value) => {
        setFormData((previousFormData) => ({
            ...previousFormData,
            guideAddress: {
                ...previousFormData.guideAddress,
                [field]: value,
            },
        }));
    };

    const handleRegionChange = async (event) => {
        const regionCode = event.target.value;
        const selectedRegion = regionOptions.find((region) => region.code === regionCode);

        setProvinceOptions([]);
        setCityMunicipalityOptions([]);
        setBarangayOptions([]);
        setFormData((previousFormData) => ({
            ...previousFormData,
            guideAddress: {
                ...previousFormData.guideAddress,
                regionCode: selectedRegion?.code || '',
                regionName: selectedRegion?.name || '',
                provinceCode: '',
                provinceName: '',
                cityMunicipalityCode: '',
                cityMunicipalityName: '',
                barangayCode: '',
                barangayName: '',
            },
        }));

        if (!selectedRegion) {
            return;
        }

        const provinces = await loadProvinces(selectedRegion.code);
        if (!provinces.length) {
            await loadCitiesMunicipalities({ regionCode: selectedRegion.code });
        }
    };

    const handleProvinceChange = async (event) => {
        const provinceCode = event.target.value;
        const selectedProvince = provinceOptions.find((province) => province.code === provinceCode);

        setCityMunicipalityOptions([]);
        setBarangayOptions([]);
        setFormData((previousFormData) => ({
            ...previousFormData,
            guideAddress: {
                ...previousFormData.guideAddress,
                provinceCode: selectedProvince?.code || '',
                provinceName: selectedProvince?.name || '',
                cityMunicipalityCode: '',
                cityMunicipalityName: '',
                barangayCode: '',
                barangayName: '',
            },
        }));

        if (!selectedProvince) {
            return;
        }

        await loadCitiesMunicipalities({ provinceCode: selectedProvince.code });
    };

    const handleCityMunicipalityChange = async (event) => {
        const cityMunicipalityCode = event.target.value;
        const selectedCityMunicipality = cityMunicipalityOptions.find((item) => item.code === cityMunicipalityCode);

        setBarangayOptions([]);
        setFormData((previousFormData) => ({
            ...previousFormData,
            guideAddress: {
                ...previousFormData.guideAddress,
                cityMunicipalityCode: selectedCityMunicipality?.code || '',
                cityMunicipalityName: selectedCityMunicipality?.name || '',
                barangayCode: '',
                barangayName: '',
            },
        }));

        if (!selectedCityMunicipality) {
            return;
        }

        await loadBarangays(selectedCityMunicipality.code);
    };

    const handleBarangayChange = (event) => {
        const barangayCode = event.target.value;
        const selectedBarangay = barangayOptions.find((barangay) => barangay.code === barangayCode);

        setFormData((previousFormData) => ({
            ...previousFormData,
            guideAddress: {
                ...previousFormData.guideAddress,
                barangayCode: selectedBarangay?.code || '',
                barangayName: selectedBarangay?.name || '',
            },
        }));
    };

    const handleStartCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            toast.error('Camera access is not supported on this device');
            return;
        }

        setCameraLoading(true);

        try {
            stopCameraStream();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false,
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraActive(true);
        } catch (error) {
            toast.error(error.message || 'Unable to access camera');
        } finally {
            setCameraLoading(false);
        }
    };

    const handleCaptureSelfie = () => {
        const videoElement = videoRef.current;
        if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
            toast.error('Camera preview is not ready yet');
            return;
        }

        const canvasElement = document.createElement('canvas');
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        const canvasContext = canvasElement.getContext('2d');
        canvasContext?.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        const capturedSelfie = canvasElement.toDataURL('image/jpeg', 0.92);

        setFormData((previousFormData) => ({
            ...previousFormData,
            livenessSelfie: capturedSelfie,
            livenessCapturedAt: new Date().toISOString(),
        }));
        stopCameraStream();
        toast.success('Liveness selfie captured');
    };

    const handleRetakeSelfie = async () => {
        setFormData((previousFormData) => ({
            ...previousFormData,
            livenessSelfie: null,
            livenessCapturedAt: '',
        }));
        await handleStartCamera();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.accreditationFile) {
            toast.error('Please upload your accreditation document');
            return;
        }

        if (!formData.guideAddress.regionCode || !formData.guideAddress.cityMunicipalityCode || !formData.guideAddress.barangayCode || !formData.guideAddress.streetAddress.trim()) {
            toast.error('Please complete your PSGC-based guide address');
            return;
        }

        if (!formData.livenessSelfie) {
            toast.error('Please capture your live selfie first');
            return;
        }

        await onSubmit(formData);
    };

    const applicationAddress = formData.guideAddress;
    const provinceSelectionRequired = provinceOptions.length > 0;
    const formattedLivenessCapturedAt = formData.livenessCapturedAt
        ? new Date(formData.livenessCapturedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        : null;

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!user?.profilePicture && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 text-sm">
                        <strong>Note:</strong> A profile picture is required before applying as a tour guide.
                    </p>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Your account information and submitted verification files will be shared with the admin team for review.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                    Accreditation / ID Document
                </label>
                <p className="text-xs text-stone-500 mb-2">
                    Upload your DOT accreditation card, government ID, or relevant certification.
                </p>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleAccreditationFileChange}
                        className="hidden"
                        id="accreditation-file"
                    />
                    <label
                        htmlFor="accreditation-file"
                        className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-terracotta-400 hover:bg-terracotta-50/50 transition-colors"
                    >
                        {formData.accreditationFileName ? (
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-terracotta-500" />
                                <div className="text-left">
                                    <p className="font-medium text-stone-800">
                                        {formData.accreditationFileName}
                                    </p>
                                    <p className="text-xs text-stone-500">
                                        Click to change file
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                                <p className="text-stone-600 font-medium">
                                    Click to upload
                                </p>
                                <p className="text-xs text-stone-500">
                                    PNG, JPG, or PDF (max 1MB)
                                </p>
                            </div>
                        )}
                    </label>
                </div>
            </div>

            <div className="rounded-xl border border-stone-200 p-4 bg-stone-50 space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-terracotta-500" />
                    <h3 className="font-medium text-stone-800">Guide Address</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Region</label>
                        <select
                            value={applicationAddress.regionCode}
                            onChange={handleRegionChange}
                            disabled={loadingRegions}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                        >
                            <option value="">Select region...</option>
                            {regionOptions.map((region) => (
                                <option key={region.code} value={region.code}>{region.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Province</label>
                        <select
                            value={applicationAddress.provinceCode}
                            onChange={handleProvinceChange}
                            disabled={!applicationAddress.regionCode || !provinceSelectionRequired || loadingProvinces}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500 disabled:bg-stone-100"
                        >
                            <option value="">{provinceSelectionRequired ? 'Select province...' : 'No province selection required'}</option>
                            {provinceOptions.map((province) => (
                                <option key={province.code} value={province.code}>{province.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">City / Municipality</label>
                        <select
                            value={applicationAddress.cityMunicipalityCode}
                            onChange={handleCityMunicipalityChange}
                            disabled={!applicationAddress.regionCode || (provinceSelectionRequired && !applicationAddress.provinceCode) || loadingCitiesMunicipalities}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500 disabled:bg-stone-100"
                        >
                            <option value="">Select city or municipality...</option>
                            {cityMunicipalityOptions.map((cityMunicipality) => (
                                <option key={cityMunicipality.code} value={cityMunicipality.code}>{cityMunicipality.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Barangay</label>
                        <select
                            value={applicationAddress.barangayCode}
                            onChange={handleBarangayChange}
                            disabled={!applicationAddress.cityMunicipalityCode || loadingBarangays}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500 disabled:bg-stone-100"
                        >
                            <option value="">Select barangay...</option>
                            {barangayOptions.map((barangay) => (
                                <option key={barangay.code} value={barangay.code}>{barangay.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Street Address</label>
                    <input
                        type="text"
                        value={applicationAddress.streetAddress}
                        onChange={(event) => handleAddressValueChange('streetAddress', event.target.value)}
                        placeholder="House number, street, building, or purok"
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-stone-200 p-4 bg-stone-50 space-y-4">
                <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-terracotta-500" />
                    <h3 className="font-medium text-stone-800">Live Selfie Check</h3>
                </div>
                <p className="text-xs text-stone-500">
                    Open your front camera and capture a fresh selfie for identity review.
                </p>

                {formData.livenessSelfie ? (
                    <div className="space-y-3">
                        <img
                            src={formData.livenessSelfie}
                            alt="Captured liveness selfie"
                            className="w-full max-h-72 object-cover rounded-xl border border-stone-200 bg-white"
                        />
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm text-stone-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-sage-600" />
                                <span>{formattedLivenessCapturedAt ? `Captured ${formattedLivenessCapturedAt}` : 'Selfie captured'}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleRetakeSelfie}
                                disabled={cameraLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retake
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-xl overflow-hidden border border-stone-200 bg-black aspect-video flex items-center justify-center">
                            {cameraActive ? (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-stone-300 px-4">
                                    <Camera className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Open your front camera to capture a selfie</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {!cameraActive ? (
                                <button
                                    type="button"
                                    onClick={handleStartCamera}
                                    disabled={cameraLoading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {cameraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    Open Camera
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleCaptureSelfie}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors"
                                    >
                                        <Camera className="w-4 h-4" />
                                        Capture Selfie
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCameraStream}
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-white transition-colors"
                                    >
                                        Cancel Camera
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => {
                        stopCameraStream();
                        onCancel();
                    }}
                    className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 font-medium rounded-xl hover:bg-stone-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting || !user?.profilePicture}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${submitButtonClassName}`}
                >
                    {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        submitLabel
                    )}
                </button>
            </div>
        </form>
    );
};

export default GuideApplicationForm;
