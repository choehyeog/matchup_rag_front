import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing/Landing'
import ScanGuide from '@/pages/ScanGuide/ScanGuide'
import ScanComplete from '@/pages/ScanComplete/ScanComplete'
import ScanInput from '@/pages/ScanInput/ScanInput'
import QuickReport from '@/pages/QuickReport/QuickReport'
import DeepSurvey from '@/pages/DeepSurvey/DeepSurvey'
import DeepReport from '@/pages/DeepReport/DeepReport'
import CaseSurvey from '@/pages/CaseSurvey/CaseSurvey'
import CaseReport from '@/pages/CaseReport/CaseReport'
import ShoeComparison from '@/pages/ShoeComparison/ShoeComparison'
import ShoeDetail from '@/pages/ShoeDetail/ShoeDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── New onboarding flow ── */}
        <Route path="/welcome" element={<Landing />} />
        <Route path="/scan" element={<ScanGuide />} />
        <Route path="/scan/camera" element={<ScanGuide cameraOnly />} />
        <Route path="/scan/complete" element={<ScanComplete />} />

        {/* ── Existing RAG flow ── */}
        <Route path="/" element={<ScanInput />} />
        <Route path="/scan/input" element={<ScanInput />} />
        <Route path="/report/quick" element={<QuickReport />} />
        <Route path="/report/deep-survey" element={<DeepSurvey />} />
        <Route path="/report/deep" element={<DeepReport />} />
        <Route path="/report/case-survey" element={<CaseSurvey />} />
        <Route path="/report/case" element={<CaseReport />} />
        <Route path="/report/shoes" element={<ShoeComparison />} />
        <Route path="/report/shoes/:shoeId" element={<ShoeDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
