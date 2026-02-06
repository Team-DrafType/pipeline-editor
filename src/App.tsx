import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import NodeSettingsPanel from './components/NodeSettingsPanel';
import useAutoLoad from './hooks/useAutoLoad';

export default function App() {
  useAutoLoad();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f172a]">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <NodeSettingsPanel />
      </div>
    </div>
  );
}
