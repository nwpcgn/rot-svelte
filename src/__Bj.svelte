<script lang="ts">
	// Card types and deck creation
	const suits = ['♠', '♥', '♦', '♣']
	const values = [
		'A',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'10',
		'J',
		'Q',
		'K'
	]

	function createDeck() {
		const deck = []
		for (let suit of suits) {
			for (let value of values) {
				deck.push({ suit, value })
			}
		}
		return shuffleDeck(deck)
	}

	function shuffleDeck(deck) {
		const shuffled = [...deck]
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
		}
		return shuffled
	}

	function getCardValue(card, currentTotal) {
		if (card.value === 'A') {
			return currentTotal + 11 > 21 ? 1 : 11
		} else if (['J', 'Q', 'K'].includes(card.value)) {
			return 10
		}
		return parseInt(card.value)
	}

	function calculateHandValue(hand) {
		let total = 0
		let aces = 0

		for (let card of hand) {
			if (card.value === 'A') {
				aces++
				total += 11
			} else if (['J', 'Q', 'K'].includes(card.value)) {
				total += 10
			} else {
				total += parseInt(card.value)
			}
		}

		while (total > 21 && aces > 0) {
			total -= 10
			aces--
		}

		return total
	}

	// Game state
	let deck = $state(createDeck())
	let playerHand = $state([])
	let dealerHand = $state([])
	let gameStatus = $state('betting') // betting, playing, dealer, finished
	let message = $state('Place your bet to start')
	let playerBalance = $state(1000)
	let currentBet = $state(0)
	let revealDealerCard = $state(false)

	// Derived values
	let playerTotal = $derived(calculateHandValue(playerHand))
	let dealerTotal = $derived(calculateHandValue(dealerHand))
	let displayedDealerTotal = $derived(
		revealDealerCard
			? dealerTotal
			: dealerHand.length > 0
				? getCardValue(dealerHand[0], 0)
				: 0
	)

	function placeBet(amount) {
		if (amount > playerBalance) {
			message = 'Insufficient balance!'
			return
		}

		currentBet = amount
		playerBalance -= amount
		startGame()
	}

	function startGame() {
		deck = createDeck()
		playerHand = [deck.pop(), deck.pop()]
		dealerHand = [deck.pop(), deck.pop()]
		gameStatus = 'playing'
		revealDealerCard = false
		message = 'Hit or Stand?'

		// Check for natural blackjack
		if (playerTotal === 21) {
			endGame('blackjack')
		}
	}

	function hit() {
		if (gameStatus !== 'playing') return

		playerHand = [...playerHand, deck.pop()]

		if (playerTotal > 21) {
			endGame('bust')
		} else if (playerTotal === 21) {
			stand()
		}
	}

	function stand() {
		if (gameStatus !== 'playing') return

		gameStatus = 'dealer'
		revealDealerCard = true
		message = "Dealer's turn..."

		setTimeout(() => {
			dealerPlay()
		}, 1000)
	}

	function dealerPlay() {
		if (dealerTotal < 17) {
			dealerHand = [...dealerHand, deck.pop()]
			setTimeout(() => {
				dealerPlay()
			}, 1000)
		} else {
			determineWinner()
		}
	}

	function determineWinner() {
		if (dealerTotal > 21) {
			endGame('win')
		} else if (playerTotal > dealerTotal) {
			endGame('win')
		} else if (playerTotal < dealerTotal) {
			endGame('lose')
		} else {
			endGame('push')
		}
	}

	function endGame(result) {
		gameStatus = 'finished'
		revealDealerCard = true

		switch (result) {
			case 'blackjack':
				message = '🎉 Blackjack! You win!'
				playerBalance += Math.floor(currentBet * 2.5)
				break
			case 'win':
				message = '🎉 You win!'
				playerBalance += currentBet * 2
				break
			case 'lose':
				message = '😞 Dealer wins!'
				break
			case 'bust':
				message = '💥 Bust! You lose!'
				break
			case 'push':
				message = '🤝 Push! Bet returned.'
				playerBalance += currentBet
				break
		}
	}

	function newGame() {
		if (playerBalance <= 0) {
			playerBalance = 1000
			message = 'Balance restored! Place your bet.'
		} else {
			message = 'Place your bet to start'
		}

		currentBet = 0
		playerHand = []
		dealerHand = []
		gameStatus = 'betting'
		revealDealerCard = false
	}
</script>

<section class="page nwp">
	<div class="padded mx-auto w-full max-w-4xl space-y-4">
		<!-- Header -->
		<div class="padded text-center shadow">
			<h3 class="font-bold text-primary">♠️ Blackjack ♥️</h3>
			<div class="text-muted-foreground flex items-center justify-center gap-4">
				<div class="text-xl">
					Balance: <span class="text-foreground font-semibold"
						>${playerBalance}</span>
				</div>
				{#if currentBet > 0}
					<div class="text-xl">
						Bet: <span class="font-semibold text-primary">${currentBet}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Game Area -->
		<div class="flex flex-col gap-4">
			<!-- Dealer Section -->
			<div class="padded shadow">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold">Dealer</h2>
					<div class="text-2xl font-bold text-accent">
						{displayedDealerTotal}
					</div>
				</div>

				<div class="flex min-h-28 flex-wrap gap-2">
					{#each dealerHand as card, i}
						<div
							class="flex h-28 w-20 flex-col items-center justify-center rounded-md border border-2 bg-secondary shadow-lg transition-all hover:scale-105">
							{#if i === 0 || revealDealerCard}
								<div
									class="text-3xl"
									class:text-accent={card.suit === '♥' || card.suit === '♦'}>
									{card.suit}
								</div>
								<div
									class=" text-xl font-bold"
									class:text-accent={card.suit === '♥' || card.suit === '♦'}>
									{card.value}
								</div>
							{:else}
								<div class="text-4xl text-primary">🂠</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Message -->
			<div class="grid min-h-28 place-content-center py-4 shadow">
				<p class="text-xl font-semibold text-primary">{message}</p>
			</div>

			<!-- Player Section -->
			<div class="padded shadow">
				<div class="flex items-center justify-between">
					<h2 class="text-foreground text-xl font-semibold">You</h2>
					<div class="text-2xl font-bold text-primary">
						{playerTotal}
					</div>
				</div>

				<div class="flex min-h-28 flex-wrap gap-2">
					{#each playerHand as card}
						<div
							class="border-border flex h-28 w-20 flex-col items-center justify-center rounded-md border-2 bg-secondary shadow-lg transition-all hover:scale-105">
							<div
								class="text-3xl"
								class:text-accent={card.suit === '♥' || card.suit === '♦'}>
								{card.suit}
							</div>
							<div
								class=" text-xl font-bold"
								class:text-accent={card.suit === '♥' || card.suit === '♦'}>
								{card.value}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Controls -->
			<div class="flex min-h-24 items-center justify-center gap-3 shadow">
				{#if gameStatus === 'betting'}
					<button
						onclick={() => placeBet(10)}
						disabled={playerBalance < 10}
						class="btn btn-neutral btn-lg">
						Bet $10
					</button>
					<button
						onclick={() => placeBet(25)}
						disabled={playerBalance < 25}
						class="btn btn-neutral btn-lg">
						Bet $25
					</button>
					<button
						onclick={() => placeBet(50)}
						disabled={playerBalance < 50}
						class="btn btn-neutral btn-lg">
						Bet $50
					</button>
					<button
						onclick={() => placeBet(100)}
						disabled={playerBalance < 100}
						class="btn btn-neutral btn-lg">
						Bet $100
					</button>
				{:else if gameStatus === 'playing'}
					<div class="grid grid-cols-2 gap-3">
						<button onclick={hit} class="btn btn-lg btn-primary"> Hit </button>
						<button onclick={stand} class="btn btn-accent btn-lg">
							Stand
						</button>
					</div>
				{:else if gameStatus === 'finished'}
					<button onclick={newGame} class="btn btn-lg btn-primary">
						New Game
					</button>
				{/if}
			</div>
		</div>
	</div>
</section>
