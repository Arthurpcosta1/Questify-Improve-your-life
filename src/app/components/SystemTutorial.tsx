import Joyride, { Step, STATUS } from 'react-joyride';
import { useEffect, useState } from 'react';

const steps: Step[] = [
  {
    target: '.tour-profile',
    content: 'Status do Caçador: Aqui você acompanha seu HP, Nível e Atributos. Mantenha seu HP alto para não falhar na jornada.',
    disableBeacon: true,
  },
  {
    target: '.tour-habits',
    content: 'Hábitos: Ações repetitivas. Bons hábitos te dão XP. Maus hábitos sugam sua vida.',
  },
  {
    target: '.tour-dailies',
    content: 'Missões Diárias: Suas obrigações do dia a dia. Não deixe acumular!',
  },
  {
    target: '.tour-missions',
    content: 'Quadro de Missões: Aqui ficam seus grandes projetos e metas. Você pode colocar aqui: "Estudar para a CPA-20", "Finalizar requisitos do Integra Recife" ou "Desenvolver o site do Projeto Baiano".',
  },
  {
    target: '.tour-sidebar-dungeon',
    content: 'Masmorra de Foco: O lugar para o Trabalho Profundo. Entre aqui quando precisar de foco total para codar em React ou estudar Logística. O sistema punirá distrações!',
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
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial');
    if (!hasSeen) {
      const checkExist = setInterval(() => {
        // Agora o Sistema procura TODOS os alvos simultaneamente
        const step1 = document.querySelector('.tour-profile');
        const step2 = document.querySelector('.tour-habits');
        const step3 = document.querySelector('.tour-dailies');
        const step4 = document.querySelector('.tour-missions');
        const step5 = document.querySelector('.tour-sidebar-dungeon');
        
        // Só liga o tutorial se os 5 elementos existirem na tela
        if (step1 && step2 && step3 && step4 && step5) {
          setRun(true);
          localStorage.setItem('hasSeenTutorial', 'true');
          clearInterval(checkExist);
        }
      }, 500);

      return () => clearInterval(checkExist);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      disableScrollParentFix={true}
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
}