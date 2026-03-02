import Joyride, { Step, STATUS } from 'react-joyride';
import { useEffect, useState } from 'react';

const steps: Step[] = [
  {
    target: '.tour-profile',
    content: 'Status do Caçador: Aqui você acompanha seu HP, Nível e Atributos. Se o HP zerar, você perde tudo.',
    disableBeacon: true,
  },
  {
    target: '.tour-habits',
    content: 'Hábitos: Ações contínuas. Bons hábitos dão XP. Maus hábitos causam dano.',
  },
  {
    target: '.tour-dailies',
    content: 'Missões Diárias: Tarefas únicas do dia. Complete para ganhar Ouro e evoluir.',
  },
  {
    target: '.tour-dungeon',
    content: 'Masmorra de Foco: Entre para focar sem distrações. Fuja, e o Sistema punirá você.',
  },
];

const joyrideStyles = {
  options: {
    arrowColor: '#18181b',
    backgroundColor: '#18181b',
    overlayColor: 'rgba(0,0,0,0.7)',
    primaryColor: '#3b82f6',
    textColor: '#f3f4f6',
    width: 400,
    zIndex: 9999,
  },
  buttonClose: { color: '#f3f4f6' },
  buttonNext: { backgroundColor: '#3b82f6', color: '#fff' },
  buttonBack: { color: '#3b82f6' },
  buttonSkip: { color: '#f3f4f6' },
};

export default function SystemTutorial() {
  // 1. Mudamos para FALSE! O tutorial começa desligado esperando a tela carregar.
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial');
    if (!hasSeen) {
      // 2. Espera 1 segundo para o navegador desenhar a tela, depois liga o tutorial
      const timer = setTimeout(() => {
        setRun(true);
        localStorage.setItem('hasSeenTutorial', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  console.log("Status do Tutorial:", run);

  const handleDebugStart = () => {
    localStorage.removeItem('hasSeenTutorial');
    setRun(false); // Desliga para resetar
    
    // Liga novamente após meio segundo
    setTimeout(() => {
      setRun(true);
    }, 500);
  };

  // 3. Função para garantir que o tutorial desligue quando você clicar em "Pular" ou "Finalizar"
  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  return (
    <>
      
      <Joyride
        steps={steps}
        run={run}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        disableScrollParentFix={true} // <-- Previne bugs de rolagem da tela
        callback={handleJoyrideCallback} // <-- Chama a função para desligar no final
        styles={joyrideStyles}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Finalizar',
          next: 'Próximo',
          skip: 'Pular',
        }}
      />
    </>
  );
}