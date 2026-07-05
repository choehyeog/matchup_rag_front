import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
        <Route path="/" element={<ScanInput />} />
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
