/**
 * SceneWeaver - Quiz Module
 *
 * Timed quiz system with multiple choice questions.
 *
 * Usage:
 *   quizEngine.start({
 *       questions: [...],
 *       timePerQuestion: 10,
 *       winTarget: 'quiz_win',
 *       loseTarget: 'quiz_lose'
 *   }, onComplete);
 */

var quizEngine = (function() {
    'use strict';

    var STORAGE_KEY = 'sw_quiz_seen';

    var state = {
        active: false,
        questions: [],
        currentIndex: 0,
        timePerQuestion: 10,
        timeRemaining: 0,
        winTarget: null,
        loseTarget: null,
        timerInterval: null,
        onComplete: null,
        quizId: null
    };

    // === Seen Answers Storage ===

    function getSeenAnswers() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function markAnswerSeen(quizId, questionIndex, correctIndex) {
        try {
            var seen = getSeenAnswers();
            seen[quizId + ':' + questionIndex] = correctIndex;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
        } catch (e) {
            console.warn('[Quiz] Could not save seen answer');
        }
    }

    function getSeenCorrectIndex(quizId, questionIndex) {
        var seen = getSeenAnswers();
        var key = quizId + ':' + questionIndex;
        return seen.hasOwnProperty(key) ? seen[key] : null;
    }

    // === Configuration ===

    function getConfig() {
        return {
            defaultTime: TUNING.get('quiz.defaultTimePerQuestion', 10),
            tickInterval: TUNING.get('quiz.tickInterval', 1000),
            urgentThreshold: TUNING.get('quiz.urgentThreshold', 3),
            criticalThreshold: TUNING.get('quiz.criticalThreshold', 2)
        };
    }

    // === Public API ===

    function start(config, onComplete) {
        if (state.active) {
            console.warn('[Quiz] Already active');
            return;
        }

        if (!config || !config.questions || config.questions.length === 0) {
            console.error('[Quiz] No questions provided');
            if (onComplete) onComplete({ won: false, target: null });
            return;
        }

        var cfg = getConfig();

        state.active = true;
        state.questions = config.questions;
        state.currentIndex = 0;
        state.timePerQuestion = config.timePerQuestion || cfg.defaultTime;
        state.timeRemaining = state.timePerQuestion;
        state.winTarget = config.winTarget;
        state.loseTarget = config.loseTarget;
        state.quizId = config.quizId || 'default';
        state.onComplete = onComplete;

        console.log('[Quiz] Starting with', state.questions.length, 'questions');

        eventBus.emit(Events.QUIZ_START, { questionCount: state.questions.length });
        showCurrentQuestion();
    }

    function showCurrentQuestion() {
        if (state.currentIndex >= state.questions.length) {
            endQuiz(true);
            return;
        }

        var question = state.questions[state.currentIndex];
        state.timeRemaining = state.timePerQuestion;

        var seenCorrectIndex = getSeenCorrectIndex(state.quizId, state.currentIndex);

        if (typeof quizUI !== 'undefined') {
            quizUI.showQuestion({
                questionNumber: state.currentIndex + 1,
                totalQuestions: state.questions.length,
                questionText: question.question,
                answers: question.answers,
                timeRemaining: state.timeRemaining,
                seenCorrectIndex: seenCorrectIndex
            });
        }

        startTimer();
    }

    function startTimer() {
        var cfg = getConfig();

        if (state.timerInterval) {
            clearInterval(state.timerInterval);
        }

        state.timerInterval = setInterval(function() {
            state.timeRemaining--;

            if (typeof quizUI !== 'undefined') {
                quizUI.updateCountdown(state.timeRemaining, cfg);
            }

            if (state.timeRemaining <= 0) {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
                endQuiz(false, 'timeout');
            }
        }, cfg.tickInterval);
    }

    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    function submitAnswer(answerIndex) {
        if (!state.active) return;

        stopTimer();

        var question = state.questions[state.currentIndex];

        if (!question || answerIndex < 0 || answerIndex >= question.answers.length) {
            console.error('[Quiz] Invalid answer index');
            endQuiz(false, 'error');
            return;
        }

        var selectedAnswer = question.answers[answerIndex];
        var isCorrect = selectedAnswer && selectedAnswer.correct === true;

        // Find correct answer index
        var correctIndex = -1;
        for (var i = 0; i < question.answers.length; i++) {
            if (question.answers[i].correct === true) {
                correctIndex = i;
                break;
            }
        }

        // Mark as seen for next attempt
        if (correctIndex >= 0) {
            markAnswerSeen(state.quizId, state.currentIndex, correctIndex);
        }

        eventBus.emit(Events.QUIZ_ANSWER, {
            questionIndex: state.currentIndex,
            answerIndex: answerIndex,
            correct: isCorrect
        });

        if (isCorrect) {
            state.currentIndex++;

            if (typeof quizUI !== 'undefined') {
                quizUI.showAnswerFeedback(true, function() {
                    showCurrentQuestion();
                });
            } else {
                showCurrentQuestion();
            }
        } else {
            endQuiz(false, 'wrong');
        }
    }

    function endQuiz(won, reason) {
        stopTimer();
        state.active = false;

        var target = won ? state.winTarget : state.loseTarget;
        var result = {
            won: won,
            target: target,
            reason: reason,
            questionsAnswered: state.currentIndex,
            totalQuestions: state.questions.length
        };

        console.log('[Quiz] Ended:', result);

        eventBus.emit(Events.QUIZ_END, result);

        if (typeof quizUI !== 'undefined') {
            quizUI.showOutro(result, function() {
                if (state.onComplete) {
                    state.onComplete(result);
                }
            });
        } else {
            if (state.onComplete) {
                state.onComplete(result);
            }
        }
    }

    function cancel() {
        stopTimer();
        state.active = false;

        if (typeof quizUI !== 'undefined') {
            quizUI.hide();
        }

        eventBus.emit(Events.QUIZ_CANCEL, {});
    }

    function destroy() {
        cancel();
        state.onComplete = null;
        state.questions = [];
    }

    function clearSeenAnswers() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    // === Module Export ===

    return {
        start: start,
        destroy: destroy,
        submitAnswer: submitAnswer,
        isActive: function() { return state.active; },
        getCurrentIndex: function() { return state.currentIndex; },
        getTimeRemaining: function() { return state.timeRemaining; },
        cancel: cancel,
        clearSeenAnswers: clearSeenAnswers
    };
})();

// Register as module
if (typeof SceneWeaver !== 'undefined') {
    SceneWeaver.registerModule({
        name: 'quiz',
        version: '1.0.0',
        init: function() {
            console.log('[QuizEngine] Initialized');
        }
    });
}

window.quizEngine = quizEngine;
