/**
 * SceneWeaver - Quiz UI Module
 *
 * Handles all quiz UI rendering.
 */

var quizUI = (function() {
    'use strict';

    var elements = {
        container: null,
        quizOverlay: null,
        questionText: null,
        answersContainer: null,
        countdown: null,
        progressText: null
    };

    var timeoutIds = [];

    function trackedTimeout(callback, delay) {
        var id = setTimeout(function() {
            var idx = timeoutIds.indexOf(id);
            if (idx !== -1) timeoutIds.splice(idx, 1);
            callback();
        }, delay);
        timeoutIds.push(id);
        return id;
    }

    function cancelAllTimeouts() {
        timeoutIds.forEach(function(id) { clearTimeout(id); });
        timeoutIds = [];
    }

    function getConfig() {
        return {
            urgentThreshold: TUNING.get('quiz.urgentThreshold', 3),
            criticalThreshold: TUNING.get('quiz.criticalThreshold', 2),
            feedbackDelay: TUNING.get('quiz.feedbackDelay', 500),
            outroDelay: TUNING.get('quiz.outroDelay', 2000)
        };
    }

    function init(container) {
        elements.container = container || document.getElementById('sw-container');
    }

    function showQuestion(data) {
        hide();

        if (!elements.container) {
            elements.container = document.getElementById('sw-container');
        }

        var overlay = document.createElement('div');
        overlay.className = 'sw-quiz-overlay';
        overlay.id = 'sw-quiz-overlay';

        // Progress
        var progress = document.createElement('div');
        progress.className = 'sw-quiz-progress';
        progress.textContent = 'Question ' + data.questionNumber + '/' + data.totalQuestions;
        elements.progressText = progress;

        // Countdown
        var countdown = document.createElement('div');
        countdown.className = 'sw-quiz-countdown';
        countdown.textContent = data.timeRemaining;
        elements.countdown = countdown;

        // Question
        var questionEl = document.createElement('div');
        questionEl.className = 'sw-quiz-question';
        questionEl.textContent = data.questionText;
        elements.questionText = questionEl;

        // Answers
        var answersContainer = document.createElement('div');
        answersContainer.className = 'sw-quiz-answers';
        elements.answersContainer = answersContainer;

        data.answers.forEach(function(answer, index) {
            var btn = document.createElement('button');
            btn.className = 'sw-quiz-answer-btn';
            btn.textContent = answer.text;
            btn.setAttribute('data-index', index);

            // Hint if seen before
            if (data.seenCorrectIndex !== null && data.seenCorrectIndex === index) {
                btn.classList.add('sw-quiz-answer-hint');
            }

            btn.addEventListener('click', function() {
                handleAnswerClick(index);
            });

            answersContainer.appendChild(btn);
        });

        // Assemble
        overlay.appendChild(progress);
        overlay.appendChild(countdown);
        overlay.appendChild(questionEl);
        overlay.appendChild(answersContainer);

        elements.quizOverlay = overlay;
        elements.container.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.classList.add('sw-quiz-visible');
        });
    }

    function handleAnswerClick(index) {
        var buttons = elements.answersContainer.querySelectorAll('.sw-quiz-answer-btn');
        buttons.forEach(function(btn) { btn.disabled = true; });
        buttons[index].classList.add('sw-quiz-answer-selected');

        if (typeof quizEngine !== 'undefined') {
            quizEngine.submitAnswer(index);
        }
    }

    function updateCountdown(timeRemaining, config) {
        if (!elements.countdown) return;

        var cfg = config || getConfig();

        elements.countdown.textContent = timeRemaining;
        elements.countdown.classList.remove('sw-quiz-countdown-pulse', 'sw-quiz-countdown-urgent', 'sw-quiz-countdown-critical');

        if (timeRemaining <= cfg.criticalThreshold) {
            elements.countdown.classList.add('sw-quiz-countdown-critical');
        } else if (timeRemaining <= cfg.urgentThreshold) {
            elements.countdown.classList.add('sw-quiz-countdown-urgent');
        }

        void elements.countdown.offsetWidth;
        elements.countdown.classList.add('sw-quiz-countdown-pulse');
    }

    function showAnswerFeedback(correct, callback) {
        var cfg = getConfig();

        if (correct && elements.quizOverlay) {
            elements.quizOverlay.classList.add('sw-quiz-correct-flash');

            trackedTimeout(function() {
                if (elements.quizOverlay) {
                    elements.quizOverlay.classList.remove('sw-quiz-correct-flash');
                }
                if (callback) callback();
            }, cfg.feedbackDelay);
        } else {
            if (callback) callback();
        }
    }

    function showOutro(result, callback) {
        var cfg = getConfig();

        if (elements.quizOverlay) {
            elements.quizOverlay.classList.remove('sw-quiz-visible');
        }

        var mainText = result.won ? 'Quiz Complete!' : 'Quiz Failed';
        var subText = result.won ? 'All answers correct!' :
            (result.reason === 'timeout' ? "Time's up!" : 'Wrong answer!');
        var overlayClass = result.won ? 'sw-quiz-victory' : 'sw-quiz-defeat';

        var outroOverlay = document.createElement('div');
        outroOverlay.className = 'sw-quiz-outro-overlay ' + overlayClass;
        outroOverlay.id = 'sw-quiz-outro-overlay';

        var textEl = document.createElement('div');
        textEl.className = 'sw-quiz-outro-text';
        textEl.textContent = mainText;
        outroOverlay.appendChild(textEl);

        var subEl = document.createElement('div');
        subEl.className = 'sw-quiz-outro-subtext';
        subEl.textContent = subText;
        outroOverlay.appendChild(subEl);

        if (elements.container) {
            elements.container.appendChild(outroOverlay);
        }

        trackedTimeout(function() {
            var outro = document.getElementById('sw-quiz-outro-overlay');
            if (outro && outro.parentNode) {
                outro.parentNode.removeChild(outro);
            }
            hide();
            if (callback) callback();
        }, cfg.outroDelay);
    }

    function hide() {
        cancelAllTimeouts();

        if (elements.quizOverlay && elements.quizOverlay.parentNode) {
            elements.quizOverlay.parentNode.removeChild(elements.quizOverlay);
        }

        elements.quizOverlay = null;
        elements.questionText = null;
        elements.answersContainer = null;
        elements.countdown = null;
        elements.progressText = null;
    }

    return {
        init: init,
        showQuestion: showQuestion,
        updateCountdown: updateCountdown,
        showAnswerFeedback: showAnswerFeedback,
        showOutro: showOutro,
        hide: hide,
        isVisible: function() { return elements.quizOverlay !== null; }
    };
})();

window.quizUI = quizUI;
