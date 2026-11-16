import type { CSSProperties } from 'react';
import { Steps } from 'tdesign-react';
export const orderStepTitles = ['客户与患者', '服务需求', '资料上传', '确认并提交'];
/** The intake is a single business step; its internal verification stays inside that step. */
export function OrderSteps({ current, onChange, entryLabel, entryReady = true, busy = false }: {
    current: number;
    onChange: (step: number) => void;
    entryLabel?: string;
    entryReady?: boolean;
    busy?: boolean;
}) {
    const titles = entryLabel ? [entryLabel, ...orderStepTitles] : orderStepTitles;
    const changeStep = (index: string | number) => {
        const target = Number(index);
        if (!busy && Number.isInteger(target) && target >= 0 && target < titles.length
            && (!entryLabel || target === 0 || entryReady)) {
            onChange(target);
        }
    };
    return (
        <div className="sales-order-steps" style={{ '--order-step-count': titles.length } as CSSProperties}>
            <Steps current={current} layout="horizontal" readOnly={busy} onChange={changeStep}>
                {titles.map((title, index) => {
                    const locked = !!entryLabel && index > 0 && !entryReady;
                    return (
                        <Steps.StepItem
                            key={title}
                            className={locked ? 'order-step-locked' : ''}
                            title={
                                <button
                                    type="button"
                                    className="sales-order-step-title"
                                    disabled={busy || locked}
                                    onClick={event => { event.stopPropagation(); changeStep(index); }}
                                >
                                    {title}
                                </button>
                            }
                        />
                    );
                })}
            </Steps>
        </div>
    );
}
