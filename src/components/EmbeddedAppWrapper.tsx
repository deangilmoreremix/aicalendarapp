import { useEffect, ReactNode } from 'react';
import { hostCommunication } from '../utils/hostCommunication';
import { useHostTheme } from '../hooks/useHostTheme';
import { useHostDataSync } from '../hooks/useHostDataSync';

interface EmbeddedAppWrapperProps {
  children: ReactNode;
  hostOrigin?: string;
  enableAutoHeight?: boolean;
}

export function EmbeddedAppWrapper({
  children,
  hostOrigin,
  enableAutoHeight = true
}: EmbeddedAppWrapperProps) {
  useHostTheme();
  useHostDataSync();

  useEffect(() => {
    if (hostOrigin) {
      hostCommunication.setHostOrigin(hostOrigin);
    }

    if (hostCommunication.getIsEmbedded()) {
      hostCommunication.notifyReady();

      if (enableAutoHeight) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const height = entry.contentRect.height;
            hostCommunication.notifyHeightChange(height);
          }
        });

        resizeObserver.observe(document.body);

        return () => {
          resizeObserver.disconnect();
        };
      }
    }
  }, [hostOrigin, enableAutoHeight]);

  return <>{children}</>;
}
